

export interface InputType {
    ssml:string;
    text:string;
}

export interface VoiceType {
    name:string;
    languageCode:string;
    ssmlGender:string;
}

export interface AudioType {
    audioEncoding:string;
}

export interface requestType {
    input:InputType;
    voice:VoiceType;
    audioConfig:AudioType;
}


export interface templateType {

    [key: string]: boolean;    
}

export interface template {

    [key: string]: templValue;
}
export interface templValue {

    [key: string]: string;    
}




export interface segment {

    templateVar: string;

    [key: string]: segmentVal|string;
}
export interface segmentVal {

    fileid:string;
    SSML: string;
    cues: Array<cuePoint>;
    duration:number;
    trim:number;
    volume:number;
}

export interface cuePoint {
    name:string;
    offset: number;
    relTime:number;
}


export interface timedEvents {

    [key: string]: string;

    start:string;
    end:string;
}

export interface scriptInstance {
    datasource:string;
    html:string;
    text:string;
    cueSet:string;
    segments:Array<segment>;
    trim:Array<number>;
    volume:Array<number>;
    timedSet:Array<timedEvents>;
    templates:any;
}

export interface findArray extends Array<string> {
    index:number;
    endIndex?:number;
}


