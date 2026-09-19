// A minimal SMTP client for the Workers runtime.
//
// shylenko.com is hosted on PrivateEmail, which offers SMTP and no REST API,
// so there is nothing to POST to — the protocol has to be spoken directly.
// Cloudflare's socket API makes that possible: port 465 with implicit TLS,
// which is also the only way out, since outbound 25 is blocked.
//
// Deliberately small. It sends one short plain-text message to one recipient
// and nothing else: no attachments, no HTML alternative, no connection reuse.
// Every one of those would be a reason for this file to grow, and none of them
// is needed to tell the club that a job arrived.
//
// The body is base64-encoded rather than sent as raw text. That sidesteps two
// real footguns at once: dot-stuffing (a line beginning with "." ends the DATA
// section) and any question about how a Hungarian accent survives the wire.

import { connect } from "cloudflare:sockets";

const CRLF = "\r\n";

function b64(bytes) {
  let out = "";
  for (const byte of bytes) out += String.fromCharCode(byte);
  return btoa(out);
}
const b64text = (text) => b64(new TextEncoder().encode(text));

// RFC 2047. Subjects carry non-ASCII; headers are ASCII-only.
function encodeHeader(text) {
  return /^[\x20-\x7e]*$/.test(text) ? text : `=?UTF-8?B?${b64text(text)}?=`;
}

// A display name goes through RFC 2047; the address itself never does.
function addr(name, email) {
  return name ? `${encodeHeader(name)} <${email}>` : email;
}

function wrap(text, width = 76) {
  const lines = [];
  for (let i = 0; i < text.length; i += width) lines.push(text.slice(i, i + width));
  return lines.join(CRLF);
}

class Conn {
  constructor(socket) {
    this.socket = socket;
    this.writer = socket.writable.getWriter();
    this.reader = socket.readable.getReader();
    this.buffer = "";
    this.decoder = new TextDecoder();
  }

  // Read until a complete reply. SMTP continues a reply with "250-" and ends
  // it with "250 ", so the space is what says the server has finished talking.
  async reply() {
    for (;;) {
      const lines = this.buffer.split(CRLF);
      for (const line of lines) {
        if (/^\d{3} /.test(line)) {
          const all = this.buffer;
          this.buffer = "";
          return { code: Number(line.slice(0, 3)), text: all.trim() };
        }
      }
      const { value, done } = await this.reader.read();
      if (done) throw new Error(`connection closed mid-reply: ${this.buffer.trim()}`);
      this.buffer += this.decoder.decode(value, { stream: true });
    }
  }

  async send(line, expect) {
    await this.writer.write(new TextEncoder().encode(line + CRLF));
    if (!expect) return null;
    const response = await this.reply();
    if (!expect.includes(response.code)) {
      // Never echo the command back: one of them carries the password.
      throw new Error(`SMTP ${response.code}: ${response.text.slice(0, 200)}`);
    }
    return response;
  }

  async close() {
    try { await this.writer.close(); } catch {}
    try { await this.socket.close(); } catch {}
  }
}

/**
 * @param {object} options
 * @param {string} options.host      SMTP host, e.g. mail.privateemail.com
 * @param {number} [options.port]    465, implicit TLS
 * @param {string} options.user      mailbox to authenticate as
 * @param {string} options.pass      its password
 * @param {string} options.from      envelope sender, normally the same mailbox
 * @param {string} [options.fromName] display name
 * @param {string} options.to
 * @param {string} [options.replyTo]
 * @param {string} options.subject
 * @param {string} options.text      UTF-8 plain text
 */
export async function sendMail(options) {
  const port = options.port || 465;
  const socket = connect({ hostname: options.host, port },
                         { secureTransport: "on", allowHalfOpen: false });
  const conn = new Conn(socket);

  try {
    const greeting = await conn.reply();
    if (greeting.code !== 220) throw new Error(`SMTP greeting ${greeting.code}`);

    await conn.send(`EHLO bhw.hu`, [250]);
    // AUTH LOGIN rather than PLAIN: PrivateEmail advertises both, and LOGIN's
    // two-step exchange keeps the password out of the same line as the command.
    await conn.send("AUTH LOGIN", [334]);
    await conn.send(b64text(options.user), [334]);
    await conn.send(b64text(options.pass), [235]);

    await conn.send(`MAIL FROM:<${options.from}>`, [250]);
    await conn.send(`RCPT TO:<${options.to}>`, [250, 251]);
    await conn.send("DATA", [354]);

    const headers = [
      `From: ${addr(options.fromName, options.from)}`,
      `To: ${options.to}`,
      options.replyTo ? `Reply-To: ${options.replyTo}` : null,
      `Subject: ${encodeHeader(options.subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${crypto.randomUUID()}@bhw.hu>`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
    ].filter(Boolean).join(CRLF);

    await conn.send(headers + CRLF + CRLF + wrap(b64text(options.text)) + CRLF + ".", [250]);
    await conn.send("QUIT", null);
  } finally {
    await conn.close();
  }
}
