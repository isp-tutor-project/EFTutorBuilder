import { TutorDataDescr } from "./IAcctData";

//*********************************************************************************
//
//  Copyright(c) 2008,2018 Kevin Willows. All Rights Reserved
//
//	License: Proprietary
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//
//*********************************************************************************

'use strict';


export class TData_RQTED2
{

    public static readonly tutorDataSpec:TutorDataDescr = {

        "tutorName":"RQMOD",

        "dataDescr": [

            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_Q1",           "dataValue":"id",     "dataSrc":"moduleState.Expt1_Q",         "dataConstr":""},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_Q1_REASON",    "dataValue":"index",  "dataSrc":"moduleState.Expt1_Reason",    "dataConstr":""},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_Q1_IMAGINE",   "dataValue":"id",     "dataSrc":"moduleState.Imagine1",        "dataConstr":""},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_Q1_IM_REASON", "dataValue":"index",  "dataSrc":"moduleState.Imagine1_Reason", "dataConstr":""},

            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_Q1_FFOCUS Row-1",    "dataValue":"Row-1 Col-3",  "dataSrc":"moduleState.FFocus:1", "dataConstr":""},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_Q1_FFOCUS Row-2",    "dataValue":"Row-2 Col-3",  "dataSrc":"moduleState.FFocus:1", "dataConstr":""},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_Q1_FFOCUS Row-3",    "dataValue":"Row-3 Col-3",  "dataSrc":"moduleState.FFocus:1", "dataConstr":""},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_Q1_FFOCUS Row-4",    "dataValue":"Row-4 Col-3",  "dataSrc":"moduleState.FFocus:1", "dataConstr":""},

            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_Q1_FF_EXPLAIN","dataValue":"index",  "dataSrc":"moduleState.FFocus:1_Explain:", "dataConstr":""},

  
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_Q2",           "dataValue":"id",     "dataSrc":"moduleState.Expt2_Q",         "dataConstr":""},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_Q2_REASON",    "dataValue":"index",  "dataSrc":"moduleState.Expt2_Reason",    "dataConstr":""},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_Q2_IMAGINE",   "dataValue":"id",     "dataSrc":"moduleState.Imagine2",        "dataConstr":""},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_Q2_IM_REASON", "dataValue":"index",  "dataSrc":"moduleState.Imagine2_Reason", "dataConstr":""},

            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_Q2_FFOCUS Row-1",    "dataValue":"Row-1 Col-3",  "dataSrc":"moduleState.FFocus:2", "dataConstr":""},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_Q2_FFOCUS Row-2",    "dataValue":"Row-2 Col-3",  "dataSrc":"moduleState.FFocus:2", "dataConstr":""},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_Q2_FFOCUS Row-3",    "dataValue":"Row-3 Col-3",  "dataSrc":"moduleState.FFocus:2", "dataConstr":""},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_Q2_FFOCUS Row-4",    "dataValue":"Row-4 Col-3",  "dataSrc":"moduleState.FFocus:2", "dataConstr":""},

            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_Q2_FF_EXPLAIN","dataValue":"index",  "dataSrc":"moduleState.FFocus:2_Explain:", "dataConstr":""},

            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"RQ_INDEX",   "dataValue":"index",  "dataSrc":"moduleState.selectedVariable",  "dataConstr":"", "id":"TV"},

            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ1 Row-1 Col-1",    "dataValue":"Row-1 Col-1",  "dataSrc":"moduleState.POSTQ:1", "dataConstr":"", "id":"1A"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ1 Row-1 Col-2",    "dataValue":"Row-1 Col-2",  "dataSrc":"moduleState.POSTQ:1", "dataConstr":"", "id":"1B"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ1 Row-2 Col-1",    "dataValue":"Row-2 Col-1",  "dataSrc":"moduleState.POSTQ:1", "dataConstr":"", "id":"2A"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ1 Row-2 Col-2",    "dataValue":"Row-2 Col-2",  "dataSrc":"moduleState.POSTQ:1", "dataConstr":"", "id":"2B"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ1 Row-3 Col-1",    "dataValue":"Row-3 Col-1",  "dataSrc":"moduleState.POSTQ:1", "dataConstr":"", "id":"3A"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ1 Row-3 Col-2",    "dataValue":"Row-3 Col-2",  "dataSrc":"moduleState.POSTQ:1", "dataConstr":"", "id":"3B"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ1 Row-4 Col-1",    "dataValue":"Row-4 Col-1",  "dataSrc":"moduleState.POSTQ:1", "dataConstr":"", "id":"4A"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ1 Row-4 Col-2",    "dataValue":"Row-4 Col-2",  "dataSrc":"moduleState.POSTQ:1", "dataConstr":"", "id":"4B"},

            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ1_TV",     "dataValue":"",  "dataSrc":"", "dataConstr":"", "process":"postTV",     "parms":"0", "id":"PT1_TV"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ1_RESULT", "dataValue":"",  "dataSrc":"", "dataConstr":"", "process":"postResult", "parms":"PT1_TV", "id":"PT1_RESULT"},

            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ1_REASON", "dataValue":"index",  "dataSrc":"moduleState.POSTQ:1_Reason:", "dataConstr":""},


            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ2 Row-1 Col-1",    "dataValue":"Row-1 Col-1",  "dataSrc":"moduleState.POSTQ:2", "dataConstr":"", "id":"1A"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ2 Row-1 Col-2",    "dataValue":"Row-1 Col-2",  "dataSrc":"moduleState.POSTQ:2", "dataConstr":"", "id":"1B"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ2 Row-2 Col-1",    "dataValue":"Row-2 Col-1",  "dataSrc":"moduleState.POSTQ:2", "dataConstr":"", "id":"2A"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ2 Row-2 Col-2",    "dataValue":"Row-2 Col-2",  "dataSrc":"moduleState.POSTQ:2", "dataConstr":"", "id":"2B"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ2 Row-3 Col-1",    "dataValue":"Row-3 Col-1",  "dataSrc":"moduleState.POSTQ:2", "dataConstr":"", "id":"3A"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ2 Row-3 Col-2",    "dataValue":"Row-3 Col-2",  "dataSrc":"moduleState.POSTQ:2", "dataConstr":"", "id":"3B"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ2 Row-4 Col-1",    "dataValue":"Row-4 Col-1",  "dataSrc":"moduleState.POSTQ:2", "dataConstr":"", "id":"4A"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ2 Row-4 Col-2",    "dataValue":"Row-4 Col-2",  "dataSrc":"moduleState.POSTQ:2", "dataConstr":"", "id":"4B"},

            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ2_TV",     "dataValue":"",  "dataSrc":"", "dataConstr":"", "process":"postTV",     "parms":"1",  "id":"PT2_TV"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ2_RESULT", "dataValue":"",  "dataSrc":"", "dataConstr":"", "process":"postResult", "parms":"PT2_TV",  "id":"PT2_RESULT"},

            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ2_REASON", "dataValue":"index",  "dataSrc":"moduleState.POSTQ:2_Reason:", "dataConstr":""},


            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ3 Row-1 Col-1",    "dataValue":"Row-1 Col-1",  "dataSrc":"moduleState.POSTQ:3", "dataConstr":"", "id":"1A"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ3 Row-1 Col-2",    "dataValue":"Row-1 Col-2",  "dataSrc":"moduleState.POSTQ:3", "dataConstr":"", "id":"1B"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ3 Row-2 Col-1",    "dataValue":"Row-2 Col-1",  "dataSrc":"moduleState.POSTQ:3", "dataConstr":"", "id":"2A"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ3 Row-2 Col-2",    "dataValue":"Row-2 Col-2",  "dataSrc":"moduleState.POSTQ:3", "dataConstr":"", "id":"2B"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ3 Row-3 Col-1",    "dataValue":"Row-3 Col-1",  "dataSrc":"moduleState.POSTQ:3", "dataConstr":"", "id":"3A"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ3 Row-3 Col-2",    "dataValue":"Row-3 Col-2",  "dataSrc":"moduleState.POSTQ:3", "dataConstr":"", "id":"3B"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ3 Row-4 Col-1",    "dataValue":"Row-4 Col-1",  "dataSrc":"moduleState.POSTQ:3", "dataConstr":"", "id":"4A"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ3 Row-4 Col-2",    "dataValue":"Row-4 Col-2",  "dataSrc":"moduleState.POSTQ:3", "dataConstr":"", "id":"4B"},

            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ3_TV",     "dataValue":"",  "dataSrc":"", "dataConstr":"", "process":"postTV",     "parms":"2",  "id":"PT3_TV"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ3_RESULT", "dataValue":"",  "dataSrc":"", "dataConstr":"", "process":"postResult", "parms":"PT3_TV",  "id":"PT3_RESULT"},

            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ3_REASON", "dataValue":"index",  "dataSrc":"moduleState.POSTQ:3_Reason:", "dataConstr":""},


            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ4 Row-1 Col-1",    "dataValue":"Row-1 Col-1",  "dataSrc":"moduleState.POSTQ:4", "dataConstr":"", "id":"1A"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ4 Row-1 Col-2",    "dataValue":"Row-1 Col-2",  "dataSrc":"moduleState.POSTQ:4", "dataConstr":"", "id":"1B"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ4 Row-2 Col-1",    "dataValue":"Row-2 Col-1",  "dataSrc":"moduleState.POSTQ:4", "dataConstr":"", "id":"2A"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ4 Row-2 Col-2",    "dataValue":"Row-2 Col-2",  "dataSrc":"moduleState.POSTQ:4", "dataConstr":"", "id":"2B"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ4 Row-3 Col-1",    "dataValue":"Row-3 Col-1",  "dataSrc":"moduleState.POSTQ:4", "dataConstr":"", "id":"3A"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ4 Row-3 Col-2",    "dataValue":"Row-3 Col-2",  "dataSrc":"moduleState.POSTQ:4", "dataConstr":"", "id":"3B"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ4 Row-4 Col-1",    "dataValue":"Row-4 Col-1",  "dataSrc":"moduleState.POSTQ:4", "dataConstr":"", "id":"4A"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ4 Row-4 Col-2",    "dataValue":"Row-4 Col-2",  "dataSrc":"moduleState.POSTQ:4", "dataConstr":"", "id":"4B"},

            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ4_TV",     "dataValue":"",  "dataSrc":"", "dataConstr":"", "process":"postTV",     "parms":"3",  "id":"PT4_TV"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ4_RESULT", "dataValue":"",  "dataSrc":"", "dataConstr":"", "process":"postResult", "parms":"PT4_TV", "id":"PT4_RESULT"},

            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POSTQ4_REASON", "dataValue":"index",  "dataSrc":"moduleState.POSTQ:4_Reason:", "dataConstr":""},

            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"TED_POST_CORRECT", "dataValue":"",  "dataSrc":"", "dataConstr":"", "process":"postNumCorrect", "parms":"",  "id":"PT_CORRECT"}

        ]
    }
}