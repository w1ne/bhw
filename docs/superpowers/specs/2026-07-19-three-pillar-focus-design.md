# Three-pillar focus design

## Goal

Make the “What happens” section more coherent by reducing it from four cards to three.

## Scope

- Remove the standalone Digital twins card.
- Keep a Firmware engineering card: “Testable firmware, reliable CI, and lessons from real failures.”
- Replace the existing embedded card with Product, hardware & CAD: “From concepts and digital models to boards, sensors, embedded systems and robotics.”
- Keep Open knowledge: “Show what you’re building, share what breaks, and learn together.”
- Provide matching Hungarian titles and copy, preserving the current card visual style and responsive layout.

## Verification

- The source contract confirms exactly three `WhatWeDo` cards and no Digital twins copy.
- The Astro build succeeds and the deployed page contains the three approved English titles.
