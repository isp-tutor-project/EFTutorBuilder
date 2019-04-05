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

import { TutorDataDescr } from "./IAcctData";


export class TData_DR
{

    public static readonly tutorDataSpec:TutorDataDescr = {

        "tutorName":"DR",

        "dataDescr": [

//            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"DR_Q1_START_TIME",  "dataValue":"",       "dataSrc":"sceneState.SScene1.$seq|prop|complete", "dataConstr":"value|false"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"DR_Q1",             "dataValue":"DR1:Sg1",  "dataSrc":"sceneState.SScene1",  "dataConstr":""},
//            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"DR_Q1_END_TIME",    "dataValue":"",       "dataSrc":"sceneState.SScene1.$seq|prop|complete", "dataConstr":"value|true"},

//            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"DR_Q2_START_TIME",  "dataValue":"",       "dataSrc":"sceneState.SScene2.$seq|prop|complete", "dataConstr":"value|false"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"DR_Q2",             "dataValue":"DR2:Sg1",  "dataSrc":"sceneState.SScene2",  "dataConstr":""},
//            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"DR_Q2_END_TIME",    "dataValue":"",       "dataSrc":"sceneState.SScene2.$seq|prop|complete", "dataConstr":"value|true"},

//            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"DR_Q3_START_TIME",  "dataValue":"",       "dataSrc":"sceneState.SScene3.$seq|prop|complete", "dataConstr":"value|false"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"DR_Q3",             "dataValue":"DR3:Sg1",  "dataSrc":"sceneState.SScene3",  "dataConstr":""},
//            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"DR_Q3_END_TIME",    "dataValue":"",       "dataSrc":"sceneState.SScene3.$seq|prop|complete", "dataConstr":"value|true"},

//            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"DR_Q4_START_TIME",  "dataValue":"",       "dataSrc":"sceneState.SScene4.$seq|prop|complete", "dataConstr":"value|false"},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"DR_Q4",             "dataValue":"DR4:Sg1",  "dataSrc":"sceneState.SScene4",  "dataConstr":""}
//            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"DR_Q4_END_TIME",    "dataValue":"",       "dataSrc":"sceneState.SScene4.$seq|prop|complete", "dataConstr":"value|true"}
        ]
    }
}