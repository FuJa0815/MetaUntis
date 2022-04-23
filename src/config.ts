import {WebUntisClass} from "./services/webUntisExtractor";

export const classes: WebUntisClass[] = JSON.parse(process.env.classes!);
export const baseUrl: string = process.env.baseUrl!;
export const schoolId: string = process.env.schoolId!;