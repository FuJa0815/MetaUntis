import express from "express";
import {extractAsync, Lesson} from "../services/webUntisExtractor";
import {baseUrl, classes, schoolId} from "../config";

export const router = express.Router();

async function getLessons(date: Date): Promise<Lesson[]> {
  return (await extractAsync({
    baseUrl: baseUrl,
    classes: classes,
    schoolId: schoolId,
    date: date
  })).sort((a,b) => a.startTime.getTime() - b.startTime.getTime());
}

/* GET info. */
router.get('/api/:date?', async (req, res) => {
  let date = new Date();
  if (req.params.date)
    date = new Date(req.params.date);

  res.json((await getLessons(date)).map(l => ({
    startTime: l.startTime,
    endTime: l.endTime,
    cellState: l.cellState,
    room: l.getRoom?.toString() || "",
    subject: l.getSubject?.toString() || "",
    teachers: l.getTeachers.map(t => t.toString()),
  })));
});

/* GET home page. */
router.get('/:date?', async (req, res) => {
  let date = new Date();
  if (req.params.date)
    date = new Date(req.params.date);

  let lessons = await getLessons(date);
  res.render('index', {lessons: lessons});
});