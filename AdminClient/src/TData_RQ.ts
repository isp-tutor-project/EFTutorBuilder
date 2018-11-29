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


export class TData_RQ
{

    public static readonly tutorDataSpec:TutorData = {

        "tutorName":"RQMOD",

        "dataDescr": [

            {"Cond":"EG_A1|EG_A2",  "dataName":"SCENE1_START",  "dataValue":"", "sceneId":"SScene1", "dataSrc":"scene.SScene1.$seq|prop|complete", "dataConstr":"value|false"},
            {"Cond":"EG_A1|EG_A2",  "dataName":"SCENE1_END",    "dataValue":"", "sceneId":"SScene1", "dataSrc":"scene.SScene1.$seq|prop|complete", "dataConstr":"value|true"},

            {"Cond":"EG_A1|EG_A2",  "dataName":"SCENE2_START", "dataValue":"",       "sceneId":"SScene2", "dataSrc":"scene.SScene2.$seq|prop|AreaSelected",   "dataConstr":"value|false"},
            {"Cond":"EG_A1|EG_A2",  "dataName":"AREA_SELECTED","dataValue":"",       "sceneId":"SScene2", "dataSrc":"scene.SScene2.$seq|prop|AreaSelected",   "dataConstr":"value|true"},
            {"Cond":"EG_A1|EG_A2",  "dataName":"AREA_NAME",    "dataValue":"value",  "sceneId":"SScene2", "dataSrc":"scene.SScene2.$seq|prop|Area Name:",     "dataConstr":""},
            {"Cond":"EG_A1|EG_A2",  "dataName":"AREA_INDEX",   "dataValue":"value",  "sceneId":"SScene2", "dataSrc":"scene.SScene2.$seq|prop|Area Index:",    "dataConstr":""},

            {"Cond":"EG_A1|EG_A2",  "dataName":"SCENE3_START",  "dataValue":"",      "sceneId":"SScene3", "dataSrc":"scene.SScene3.$seq|prop|TopicSelected",    "dataConstr":"value|false"},
            {"Cond":"EG_A1|EG_A2",  "dataName":"TOPIC_INDEX",   "dataValue":"value", "sceneId":"SScene3", "dataSrc":"scene.SScene3.$seq|prop|Topic Index:",     "dataConstr":""},

            {"Cond":"",  "dataName":"SCENE4_START",  "dataValue":"", "sceneId":"SScene4", "dataSrc":"scene.SScene4.$seq|prop|complete", "dataConstr":"value|false"},
            {"Cond":"",  "dataName":"SCENE4_END",    "dataValue":"", "sceneId":"SScene4", "dataSrc":"scene.SScene4.$seq|prop|complete", "dataConstr":"value|true"},

            {"Cond":"",  "dataName":"SCENE5_START",  "dataValue":"", "sceneId":"SScene5", "dataSrc":"scene.SScene5.$seq|prop|complete", "dataConstr":"value|false"},
            {"Cond":"",  "dataName":"SCENE5_END",    "dataValue":"", "sceneId":"SScene5", "dataSrc":"scene.SScene5.$seq|prop|complete", "dataConstr":"value|true"},

            {"Cond":"",  "dataName":"SCENE5a_START",  "dataValue":"", "sceneId":"SScene5a", "dataSrc":"scene.SScene5a.$seq|prop|complete", "dataConstr":"value|false"},
            {"Cond":"",  "dataName":"SCENE5a_END",    "dataValue":"", "sceneId":"SScene5a", "dataSrc":"scene.SScene5a.$seq|prop|complete", "dataConstr":"value|true"},

            {"Cond":"",  "dataName":"SCENE7_START",  "dataValue":"", "sceneId":"SScene7", "dataSrc":"scene.SScene7.$seq|prop|complete", "dataConstr":"value|false"},
            {"Cond":"",  "dataName":"SCENE7_END",    "dataValue":"", "sceneId":"SScene7", "dataSrc":"scene.SScene7.$seq|prop|complete", "dataConstr":"value|true"},

            {"Cond":"",  "dataName":"SCENE8_START",  "dataValue":"", "sceneId":"SScene8", "dataSrc":"scene.SScene8.$seq|prop|complete", "dataConstr":"value|false"},
            {"Cond":"",  "dataName":"SCENE8_END",    "dataValue":"", "sceneId":"SScene8", "dataSrc":"scene.SScene8.$seq|prop|complete", "dataConstr":"value|true"},

            {"Cond":"EG_A1|EG_A2",  "dataName":"SCENE9_START",   "dataValue":"",      "sceneId":"SScene9", "dataSrc":"scene.SScene9.$seq|prop|RQSelected",      "dataConstr":"value|false"},
            {"Cond":"EG_A1|EG_A2",  "dataName":"SCENE9_END",     "dataValue":"",      "sceneId":"SScene9", "dataSrc":"scene.SScene9.$seq|prop|RQSelected",      "dataConstr":"value|true"},
            {"Cond":"EG_A1|EG_A2",  "dataName":"VARIABLE_INDEX", "dataValue":"value", "sceneId":"SScene9", "dataSrc":"scene.SScene9.$seq|prop|Variable Index:", "dataConstr":""},

            {"Cond":"",  "dataName":"SCENE11_START",  "dataValue":"", "sceneId":"SScene11", "dataSrc":"scene.SScene11.$seq|prop|RQconfirmed", "dataConstr":"value|false"},
            {"Cond":"",  "dataName":"SCENE11_END",    "dataValue":"", "sceneId":"SScene11", "dataSrc":"scene.SScene11.$seq|prop|complete", "dataConstr":"value|true"},

            {"Cond":"",  "dataName":"SELECTED_AREA",     "dataValue":"ontologyKey", "sceneId":"SScene11", "dataSrc":"module.EFMod_RQSelect.selectedArea", "dataConstr":""},
            {"Cond":"",  "dataName":"SELECTED_TOPIC",    "dataValue":"ontologyKey", "sceneId":"SScene11", "dataSrc":"module.EFMod_RQSelect.selectedTopic", "dataConstr":""},
            {"Cond":"",  "dataName":"SELECTED_VARIABLE", "dataValue":"ontologyKey", "sceneId":"SScene11", "dataSrc":"module.EFMod_RQSelect.selectedVariable", "dataConstr":""}
        ]
    }
}