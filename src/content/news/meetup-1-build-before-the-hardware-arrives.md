---
title: Build before the hardware arrives
titleHu: Építs, mielőtt megjön a hardver
description: What we learned at the first Budapest Hardware Club meetup.
descriptionHu: Amit az első Budapest Hardware Club találkozón tanultunk.
date: 2026-07-14
badge: 'Meetup #1 recap'
badgeHu: 'Meetup #1 összefoglaló'
---

<p><span class="en">On 14 July, we held the first Budapest Hardware Club meetup. We talked about how hardware gets built, how it fails, and the projects people were working on.</span><span class="hu">Július 14-én megtartottuk az első Budapest Hardware Club meetupot. Arról beszélgettünk, hogyan készül a hardver, hogyan hibásodik meg, és milyen projekteken dolgoznak a résztvevők.</span></p>

<p><span class="en">The theme was simple: build before the hardware arrives.</span><span class="hu">A téma egyszerű volt: építs, mielőtt megjön a hardver.</span></p>

## <span class="en">What we covered</span><span class="hu">Amiről beszéltünk</span>

- <span class="en">We reviewed Toyota unintended acceleration, Therac-25, Patriot missile clock drift and failures from our own work. We discussed which tests could detect similar problems and used the examples to build a pre-validation checklist.</span><span class="hu">Áttekintettük a Toyota nem kívánt gyorsulását, a Therac-25 hibáit, a Patriot rakéta órahibáját és a saját munkánkból hozott példákat. Megbeszéltük, milyen tesztek ismerhetnék fel a hasonló problémákat, és ezekből előzetes validációs ellenőrzőlistát készítettünk.</span>
- <span class="en">Every bug should be reproduced in the cheapest layer, as early as possible.</span><span class="hu">Minden hibát a lehető legolcsóbb rétegben, a lehető legkorábban kell reprodukálni.</span>
- <span class="en">Treat the board as an adapter. Keep state machines, units and parsers away from GPIO and timers, so much of the behaviour can run without the physical board. The estimate discussed at the meetup was around 90%. That also makes it safer to let AI near the code.</span><span class="hu">Kezeld a panelt adapterként. Tartsd az állapotgépeket, mértékegységeket és parszereket távol a GPIO-tól és a timerektől, így a működés nagy része fizikai panel nélkül is tesztelhető. A meetupon elhangzott becslés körülbelül 90% volt. Így az AI-t is biztonságosabb közel engedni a kódhoz.</span>

<p><span class="en">We went through the stages of firmware testing:</span><span class="hu">Végigvettük a firmware tesztelésének lépéseit:</span></p>

<ol class="testing-stages">
<li><span class="en">Static checks</span><span class="hu">Statikus ellenőrzések</span></li>
<li><span class="en">Host tests</span><span class="hu">Számítógépen futó tesztek</span></li>
<li><span class="en">Integration tests</span><span class="hu">Integrációs tesztek</span></li>
<li><span class="en">Digital twin</span><span class="hu">Digitális iker</span></li>
<li><span class="en">Hardware-in-the-loop (HIL) bench</span><span class="hu">Hardveres tesztpad (HIL)</span></li>
<li><span class="en">Field telemetry</span><span class="hu">Üzemi telemetria</span></li>
</ol>

<p><span class="en">The goal is to make validation cheap enough to run before every merge. Then we got hands-on with an ESP32-C3, comparing a LabWired digital twin against the real board.</span><span class="hu">A cél az, hogy a validáció legyen elég olcsó ahhoz, hogy minden merge előtt lefusson. Ezután egy ESP32-C3-mal dolgoztunk: a LabWired digitális ikret hasonlítottuk össze a valódi panellel.</span></p>

<p><span class="en">Thank you to everyone who came, asked sharp questions and stayed to show what they are building. Thanks to Puzl CowOrKing for hosting and Csaba Gábor for the photos. This was #1 - there will be more.</span><span class="hu">Köszönjük mindenkinek, aki eljött, éles kérdéseket tett fel, és maradt megmutatni, min dolgozik. Köszönjük a Puzl CowOrKingnek a helyszínt, Csaba Gábornak pedig a fotókat. Ez csak az első volt - lesz folytatás.</span></p>

<p class="recap-cta"><span class="en">If you build firmware, hardware or robotics in Budapest, come to the next one. If you want to sponsor, cooperate or share hardware jobs, <a href="mailto:hello@bhw.hu">get in touch</a>.</span><span class="hu">Ha firmware-rel, hardverrel vagy robotikával foglalkozol Budapesten, gyere a következőre. Ha szponzorálnál, együttműködnél vagy hardveres állásokat osztanál meg, <a href="mailto:hello@bhw.hu">írj nekünk</a>.</span></p>

<div class="recap-photos"><img src="/images/recap-community-1.jpg" alt="Budapest Hardware Club members working and talking together at Meetup #1" loading="lazy" /><img src="/images/recap-community-2.jpg" alt="Budapest Hardware Club community gathered around hardware during Meetup #1" loading="lazy" /><img src="/images/recap-room.jpg" alt="Meetup #1 audience in the room" loading="lazy" /></div>
