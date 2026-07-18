# Recap photo strip design

## Goal

Make the Meetup #1 recap self-contained on bhw.hu by removing the LinkedIn continuation link and adding a compact set of three event images.

## Scope

- Replace the existing short recap copy with the supplied Meetup #1 post, adapted as an on-site news article in both English and Hungarian.
- Preserve the post's opening, event theme, firmware-failure lessons, pre-validation principle, feedback ladder, board-adapter principle, ESP32-C3 exercise, general thank-you, photo credit, and invitation for sponsors and cooperation.
- Format the technical lessons as readable bullet points and keep the feedback ladder as a visual sequence.
- Thank attendees generally; do not publish the individual attendee-name shout-outs from the post.
- Remove the English and Hungarian LinkedIn “read more” link.
- Retain `hero.jpg` as the lead image and add two supporting Meetup #1 images in a three-photo strip below the recap text. Use the supplied Google Photos album as their source; select the two wide presenter-and-audience / room-wide group shots rather than the close-up presenter shots.
- On narrow screens, stack the image strip so every image remains visible and usable.
- Keep the News section as an editorial recap, not a standalone gallery or carousel.

## Verification

- The source test confirms the recap has three image paths, the sponsor/cooperation call to action, and no LinkedIn recap link or individual attendee-name list.
- The Astro production build succeeds.
- The deployed custom domain renders all three recap images and no “Read the full recap” link.
