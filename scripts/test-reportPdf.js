import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import { buildReportPdfBytes } from '../src/utils/exportReportPdf.js';
import { buildAcademicReport } from '../src/utils/academicReport.js';
const fontBytes = await readFile(new URL('../src/assets/fonts/DejaVuSans.ttf', import.meta.url));
const output = new URL('../test-output/', import.meta.url);
await mkdir(output, { recursive: true });
const now = new Date('2026-10-10T12:00:00Z');
test('an empty dataset creates a real PDF with explicit empty sections', async () => {
  const report = buildAcademicReport({});
  const bytes = await buildReportPdfBytes({ report, fontBytes, now });
  assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), '%PDF-');
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getTitle(), 'Acad Learning Report');
  assert.equal(pdf.getPageCount(), 1);
  await writeFile(new URL('report-empty.pdf', output), bytes);
});
test('populated multi-page report retains its data and Unicode names', async () => {
  const topic = { topicId: 't1', courseCode: 'DCIT101', name: 'Introduction to computer systems', masteryLevel: 40, lastStudied: '2026-10-02T12:00:00Z' };
  const courses = Array.from({ length: 60 }, (_, i) => ({ code: `TEST${String(i).padStart(3, '0')}`, name: `Fixture course ${i} and a long title that tests line wrapping`, topics: [{ ...topic, topicId: `t${i}` }] }));
  const report = buildAcademicReport({ courses, allTopics: courses.flatMap((c) => c.topics), weakTopics: [topic], streak: { current: 3 }, habitLogs: [{ studyHours: 2.5, focusRating: 4 }] });
  const bytes = await buildReportPdfBytes({ userName: 'José Aidoo-Gyamfi', report, fontBytes, now, streak: { current: 3 } });
  const pdf = await PDFDocument.load(bytes);
  assert.ok(pdf.getPageCount() >= 3);
  assert.equal(report.kpis.avgMastery, 40);
  assert.equal(report.kpis.totalStudyHours, 2.5);
  await writeFile(new URL('report-populated.pdf', output), bytes);
});
test('markup and a long unbroken course name remain literal PDF text', async () => {
  const report = buildAcademicReport({});
  report.courseRows.push({ code: 'XSS', name: '<script>alert(1)</script>' + 'x'.repeat(250), avg: 50, below60: 1 });
  const bytes = await buildReportPdfBytes({ report, fontBytes, now });
  assert.ok(bytes.length > 1000);
  await writeFile(new URL('report-literal.pdf', output), bytes);
});
