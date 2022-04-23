# MetaUntis
Aggregates timetable from multiple WebUntis classes

You need to create a `.env` file to configure.
Example `.env` file for HTL-Grieskirchen:
```
classes='[
  { "id": 470, "name": "5AHIF",  "addsSubjects": true },
  { "id": 475, "name": "5BHIF",  "addsSubjects": true },
  { "id": 480, "name": "5CHIF",  "addsSubjects": true },
  { "id": 465, "name": "5AHBGM", "addsSubjects": false}
]'
baseUrl="https://arche.webuntis.com/WebUntis/api/public/timetable/weekly/data"
schoolId="_aHRibGEtZ3JpZXNraXJjaGVu"
```
