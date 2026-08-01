# Record and review a session

Connect the Viewer and confirm healthy status, correct calibration, plausible values, and adequate disk space before starting a capture. Select **Record**, choose a new destination, and observe duration, file size, and buffer use.

A bounded queue isolates acquisition from storage latency. The Viewer never silently discards an accepted row: overflow or write failure ends recording explicitly. Data is first written to `<name>.csv.partial`; clean stop drains and flushes all accepted rows and atomically promotes the destination to `.csv`.

## Pause and resume

**Pause** freezes numeric values and plots. During recording it first drains and flushes accepted CSV rows, then suspends CSV acceptance. Connection and health monitoring continue.

**Resume** clears the paused chart window and accepts only new samples. Samples received during pause are not replayed, so the CSV contains an intentional elapsed-time gap. Pause is therefore a recording control, not only a display control.

## Verify the file

Before a long capture, record a short controlled session and verify:

- the destination is on the intended filesystem;
- stopping produces `.csv`, not `.csv.partial`;
- the final row is complete;
- elapsed recording time is monotonic;
- unit and configuration revision accompany each scaled wrench;
- sample count is plausible for duration and RDT rate;
- a known controlled load appears on the expected axis and sign.

If a partial file remains, preserve it and inspect only complete rows. Check interruption, queue overflow, writer errors, disk space, permissions, and removable-media stability. A manually renamed partial file is not evidence of a complete requested capture.

See [Viewer CSV](../../references/data-formats/csv.mdx#viewer-recording) for exact fields and timestamp semantics.
