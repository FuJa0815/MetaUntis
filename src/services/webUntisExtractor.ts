import * as https from "https";

export async function extractAsync(options : WebUntisExtractorOptions): Promise<Lesson[]> {
    const urls = options.classes.map(c => options.baseUrl+`?elementType=1&elementId=${c.id}&date=${options.date.getFullYear()}-${options.date.getMonth()+1}-${options.date.getDate()}`);
    const httpRequests = urls.map((url: string, index: number): Promise<Lesson[]> => {
        const schoolclass = options.classes[index].name;
        return new Promise((resolve, reject) => {
            const req = https.get(url, { headers: { 'Cookie': `schoolname="${options.schoolId}"` } }, res => {
                let json = '';
                res.on('data', c => json += c);
                res.on('end', () => {
                    const o = JSON.parse(json).data.result.data;
                    const realElements = o.elements.map((e:any) => new Element(e.id, e.type, e.name, e.displayname));
                    const realElementPeriods = Object.values(o.elementPeriods as Object)[0].map((e:any) => new ElementPeriod(e.id, e.lessonId, e.lessonNumber, e.lessonText, e.date, e.startTime, e.endTime, e.elements, e.cellState));
                    const lessons = aggregateElementPeriods(realElementPeriods).map(a => new Lesson(a, realElements, schoolclass));
                    resolve(lessons);
                });
            });
            req.on('error', err => reject(err));
        });
    });
    const downloaded = await Promise.all(httpRequests);
    return downloaded.flatMap(x => x);
}

export interface WebUntisExtractorOptions {
    classes: WebUntisClass[];
    baseUrl: string;
    date: Date;
    schoolId: string;
}
export interface WebUntisClass {
    id: number;
    name: string;
}

function onlyUnique(value: any, index: number, self: any[]) {
    return self.indexOf(value) === index;
}
function aggregateElementPeriods(elements: ElementPeriod[]): ElementLesson[] {
    return Object.values(elements.reduce((rv: {[id: string]: ElementPeriod[]}, x) => {
        (rv[x.lessonNumber+""+x.date] = rv[x.lessonNumber+""+x.date] || []).push(x);
        return rv;
    }, {})).map(x => new ElementLesson(x));
}

class Element {
    type: number;
    id: number;
    name: string;
    displayname?: string;

    constructor(id: number, type: number, name: string, displayname?: string) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.displayname = displayname;
    }

    public toString = (): string => {
        if (this.displayname && this.displayname !== "")
            return this.displayname;
        return this.name;
    };

    public isRoom = (): boolean => this.type == 4;
    public isSubject = (): boolean => this.type == 3;
    public isTeacher = (): boolean => this.type == 2;
    public isClass = (): boolean => this.type == 1;
    get uid(): string {
        return this.type+""+this.id;
    }
}
class ElementPeriod {
    id: number;
    lessonId: number;
    lessonNumber: number;
    lessonText: string;
    date: number;
    startTime: number;
    endTime: number;
    elements: { type:number, id: number }[];
    cellState: string;

    public get isStandard(): boolean {
        return this.cellState == "STANDARD"
    }
    public get isFree(): boolean {
        return this.cellState == "FREE"
    }

    constructor(id: number, lessonId: number, lessonNumber: number, lessonText: string, date: number, startTime: number, endTime: number, elements: { type: number, id: number }[], cellState: string) {
        this.id = id;
        this.lessonId = lessonId;
        this.lessonNumber = lessonNumber;
        this.lessonText = lessonText;
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.elements = elements;
        this.cellState = cellState;
    }

    get elementIds(): string[] {
        return this.elements.map(e => e.type+""+e.id);
    }

    getTeachers = (elements: Element[]): Element[] => elements.filter(e => e.isTeacher() && this.elementIds.includes(e.uid));
    getRoom(elements: Element[]): Element {
        return elements.filter(e => e.isRoom() && this.elementIds.includes(e.uid))[0];
    }
    getSubject = (elements: Element[]): Element => elements.filter(e => e.isSubject() && this.elementIds.includes(e.uid))[0];
}
class ElementLesson {
    elements: ElementPeriod[];

    public get lessonId(): number {
        return this.elements[0].lessonId;
    }
    public get lessonText(): string {
        return this.elements.map(e => e.lessonText).filter(e => e !== "").filter(onlyUnique).join(',');
    }
    public get date(): number {
        return this.elements[0].date;
    }
    public get startTime(): number {
        return this.elements.map(e => e.startTime).reduce((a,b) => a < b ? a : b, Number.MAX_VALUE);
    }
    public get endTime(): number {
        return this.elements.map(e => e.endTime).reduce((a,b) => a < b ? b : a, Number.MIN_VALUE);
    }
    public get cellState(): string {
        return this.elements.map(e => e.cellState).filter(e => e !== "").filter(onlyUnique).join(',');
    }
    public get isStandard(): boolean {
        return this.elements.every(e => e.isStandard);
    }
    public get isFree(): boolean {
        return this.elements.every(e => e.isFree);
    }

    getTeachers = (elements: Element[]): Element[] => this.elements.flatMap(x => x.getTeachers(elements)).filter(onlyUnique);
    getRoom = (elements: Element[]): Element => this.elements[0].getRoom(elements);
    getSubject = (elements: Element[]): Element => this.elements[0].getSubject(elements);

    constructor(elements: ElementPeriod[]) {
        this.elements = elements;
    }
}
export class Lesson {
    internal: ElementLesson;
    elements: Element[];
    schoolclass: string;

    constructor(internal: ElementLesson, elements: Element[], schoolclass: string) {
        this.internal = internal;
        this.elements = elements;
        this.schoolclass = schoolclass;
    }
    public get lessonId(): number {
        return this.internal.lessonId;
    }
    public get lessonText(): string {
        return this.internal.lessonText;
    }
    public get date(): Date {
        let dateStr = ""+this.internal.date;
        return new Date(Number(dateStr.substring(0, 4)), Number(dateStr.substring(4, 6))-1, Number(dateStr.substring(6, 8)));
    }
    public get startTime(): Date {
        let date = this.date;
        let startTime = String(this.internal.startTime).padStart(4, '0');
        date.setHours(Number(startTime.substring(0, 2)), Number(startTime.substring(2,4)));
        return date;
    }
    public get endTime(): Date {
        let date = this.date;
        let endTime = String(this.internal.endTime).padStart(4, '0');
        date.setHours(Number(endTime.substring(0, 2)), Number(endTime.substring(2,4)));
        return date;
    }
    public get cellState(): string {
        return this.internal.cellState;
    }
    public get isStandard(): boolean {
        return this.internal.isStandard;
    }
    public get isFree(): boolean {
        return this.internal.isFree;
    }
    public get getTeachers(): Element[] {
        return this.internal.getTeachers(this.elements);
    }
    public get getRoom(): Element {
        return this.internal.getRoom(this.elements);
    }
    public get getSubject(): Element {
        return this.internal.getSubject(this.elements);
    }
}
