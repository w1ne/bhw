---
title: Build before the hardware arrives
titleHu: Építs, mielőtt megjön a hardver
description: What we learned at the first Budapest Hardware Club meetup.
descriptionHu: Amit az első Budapest Hardware Club találkozón tanultunk.
date: 2026-07-14
badge: 'Meetup #1 recap'
badgeHu: 'Meetup #1 összefoglaló'
---

<p><span class="en">Last Tuesday we held the very first Budapest Hardware Club. A room full of passionate people talked about how modern hardware gets built, how it breaks, and the projects they care about.</span><span class="hu">Múlt kedden megtartottuk az első Budapest Hardware Clubot. Szenvedélyes emberekkel telt meg a terem: arról beszélgettünk, hogyan épül a modern hardver, hogyan romlik el, és min dolgoznak az emberek.</span></p>

<p><span class="en">The theme was simple: build before the hardware arrives.</span><span class="hu">A téma egyszerű volt: építs, mielőtt megjön a hardver.</span></p>

## <span class="en">What we dug into</span><span class="hu">Amibe beleástuk magunkat</span>

- <span class="en">Famous firmware failures are engineering data, not just war stories. Toyota unintended acceleration, Therac-25, Patriot missile clock drift and personal examples all mapped back to missing tests. We turned those lessons into a pre-validation checklist.</span><span class="hu">A híres firmware-hibák nem csak háborús történetek, hanem mérnöki adatok. A Toyota gyorsulási hibája, a Therac-25, a Patriot rakéta órajel-csúszása és személyes példák mind hiányzó tesztekre vezettek vissza. Ezekből pre-validációs checklistet készítettünk.</span>
- <span class="en">Every bug should be reproduced in the cheapest layer, as early as possible.</span><span class="hu">Minden hibát a lehető legolcsóbb rétegben, a lehető legkorábban kell reprodukálni.</span>
- <span class="en">Treat the board as an adapter. Keep state machines, units and parsers away from GPIO and timers, and around 90% of interesting behaviour can run without the physical board. That also makes it safer to let AI near the code.</span><span class="hu">Kezeld a panelt adapterként. Tartsd az állapotgépeket, mértékegységeket és parszereket távol a GPIO-tól és a timerektől, így az érdekes viselkedés körülbelül 90%-a fizikai panel nélkül is futhat. Így az AI-t is biztonságosabb közel engedni a kódhoz.</span>

<p><span class="en">We climbed the firmware feedback ladder:</span><span class="hu">Végigmentünk a firmware-visszacsatolási létrán:</span></p>

<div class="ladder"><span>static gates</span><b>→</b><span>host tests</span><b>→</b><span>integration</span><b>→</b><span>digital twin</span><b>→</b><span>HIL bench</span><b>→</b><span>field telemetry</span></div>

<p><span class="en">The big idea is to make validation cheap enough to run before every merge. Then we got hands-on with an ESP32-C3, comparing a LabWired digital twin against the real board.</span><span class="hu">A nagy ötlet az, hogy a validáció legyen elég olcsó ahhoz, hogy minden merge előtt lefusson. Ezután egy ESP32-C3-mal dolgoztunk: a LabWired digitális ikret hasonlítottuk össze a valódi panellel.</span></p>

<p><span class="en">Thank you to everyone who came, asked sharp questions and stayed to show what they are building. Thanks to Puzl CowOrKing for hosting and Csaba Gábor for the photos. This was #1 - there will be more.</span><span class="hu">Köszönjük mindenkinek, aki eljött, éles kérdéseket tett fel, és maradt megmutatni, min dolgozik. Köszönjük a Puzl CowOrKingnek a helyszínt, Csaba Gábornak pedig a fotókat. Ez csak az első volt - lesz folytatás.</span></p>

<p class="recap-cta"><span class="en">If you build firmware, hardware or robotics in Budapest, come to the next one. If you want to sponsor, cooperate, organise a hackathon or share hardware jobs, <a href="mailto:hello@bhw.hu">get in touch</a>.</span><span class="hu">Ha firmware-rel, hardverrel vagy robotikával foglalkozol Budapesten, gyere a következőre. Ha szponzorálnál, együttműködnél, hackathont szerveznél vagy hardveres állásokat osztanál meg, <a href="mailto:hello@bhw.hu">írj nekünk</a>.</span></p>

<div class="recap-photos"><img src="/images/recap-community-1.jpg" alt="Budapest Hardware Club members working and talking together at Meetup #1" loading="lazy" /><img src="/images/recap-community-2.jpg" alt="Budapest Hardware Club community gathered around hardware during Meetup #1" loading="lazy" /><img src="/images/recap-room.jpg" alt="Meetup #1 audience in the room" loading="lazy" /></div>
