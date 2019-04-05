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


export class TData_RQTED1
{

    public static readonly tutorDataSpec:TutorDataDescr = {

        "tutorName":"RQMOD",

        "dataDescr": [


            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"RQ_AREA",    "dataValue":"ontologyKey",  "dataSrc":"moduleState.selectedArea",  "dataConstr":""},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"RQ_TOPIC",   "dataValue":"ontologyKey",  "dataSrc":"moduleState.selectedTopic",  "dataConstr":""},
            {"Cond":"EG_A1|EG_A2|EG_A3|any",  "dataName":"RQ_VAR",     "dataValue":"ontologyKey",  "dataSrc":"moduleState.selectedVariable",  "dataConstr":""}

        ]
    }
}