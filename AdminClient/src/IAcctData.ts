

export interface tabletData {
    
    "version":string;
    "userLogins":login[];
    "users":acctData[];
    "currUser"?:acctData;
    "tabletId"?:string;
}

export interface login {
    "userName":string;
    "timestamp":number;
}

export interface acctData {

    "userName"       :string;    
    "currSessionNdx" :number;
    "currTutorNdx"   :number;
    "currScene"      :string;
    "instructionSeq" :string;
    "tabletId"?      :string;
    "userFolder"?    :string;
}    


export interface stateData {

    "users":userState[];
}
export interface userState {

    "userName"   : string;
    "tutorState" : any;
    "moduleState": any;
    "features"   : string[];
}


export interface TutorDataDescr {

    "tutorName":string;

    "dataDescr": dataPacket[];
}


export interface dataPacket {

    "Cond":string;

    // Output value
    "dataName":string;
    "dataValue":string;

    // Data key - 
    "sceneId"?:string;
    "dataSrc":string;
    "dataConstr":string;

    // Data ID 
    "process"?:string;
    "parms"?:string;
    "id"?:string;
}

export interface TutorData {

    sceneState:any,
    moduleState:any,
    tutorState:any,
    fFeatures:any,
    featureID:any
}


export interface sceneCache  {
    
    "sceneName":string,
    "seqNdx":number,
    "iteration":number,
    "sceneData": any   
}


export interface ipData {

    "netId": number,
    "netType": string,
    "tabletId": number,
    "mac": string,
    "ip": string,
    "owner": string,
    "created": string,
    "lastseen": String,
    "failed":boolean
}

