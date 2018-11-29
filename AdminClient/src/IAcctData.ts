

export interface userData {
    
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

    "userName"      :string;    
    "currTutorNdx"  :number;
    "currScene"     :string;
    "instructionSeq":string;
    "tabletId"?     :string;
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


export interface TutorData {

    "tutorName":string;

    "dataDescr": dataPacket[];
}

export interface dataPacket {

    "Cond":string;

    // Output value
    "dataName":string;
    "dataValue":string;

    // Data key - 
    "sceneId":string;
    "dataSrc":string;
    "dataConstr":string;

}


export interface sceneCache  {
    
    "sceneName":string,
    "seqNdx":number,
    "iteration":number,
    "sceneData": any   
}