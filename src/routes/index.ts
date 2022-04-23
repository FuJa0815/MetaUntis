import express from "express";
import {extractAsync} from "../services/webUntisExtractor";
import {baseUrl, classes, schoolId} from "../config";

export const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index');
});

/* GET info. */
router.get('/api/:date', async (req, res) => {
  const lessons = await extractAsync({
    baseUrl: baseUrl,
    classes: classes,
    schoolId: schoolId,
    date: new Date(req.params.date)
  });
  res.json(lessons.map(l => ({
    startTime: l.startTime,
    endTime: l.endTime,
    cellState: l.cellState,
    room: l.getRoom.toString(),
    subject: l.getSubject.toString(),
    teachers: l.getTeachers.map(t => t.toString()),
  })));
});