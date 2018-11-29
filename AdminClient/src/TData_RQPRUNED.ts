import { TutorData } from "./IAcctData";

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


export class TData_RQPRUNED
{

    public static readonly tutorDataSpec:TutorData = {

        "tutorName":"RQMOD",

        "dataDescr": [

            {"Cond":"",  "dataName":"SELECTED_AREA",     "dataValue":"ontologyKey", "sceneId":"SScene11", "dataSrc":"module.EFMod_RQSelect.selectedArea", "dataConstr":""},
            {"Cond":"",  "dataName":"SELECTED_TOPIC",    "dataValue":"ontologyKey", "sceneId":"SScene11", "dataSrc":"module.EFMod_RQSelect.selectedTopic", "dataConstr":""},
            {"Cond":"",  "dataName":"SELECTED_VARIABLE", "dataValue":"ontologyKey", "sceneId":"SScene11", "dataSrc":"module.EFMod_RQSelect.selectedVariable", "dataConstr":""}
        ]
    }
}