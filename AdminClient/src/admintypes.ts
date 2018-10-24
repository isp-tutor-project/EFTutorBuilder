

export interface CEF_Command  {
    command:string;
    to:string;
    from:string;
    recurse:boolean;
    size:number;
    compress:boolean;
    extract:boolean;
}