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
Object.defineProperty(exports, "__esModule", { value: true });
class TData_MATSPST {
}
TData_MATSPST.tutorDataSpec = {
    "tutorName": "MATSPST",
    "dataDescr": [
        { "Cond": "EG_A1|EG_A2|EG_A3|any", "dataName": "MATS_Q1", "dataValue": "PostTest:Sg1", "dataSrc": "sceneState.SMatsPost1", "dataConstr": "" },
        { "Cond": "EG_A1|EG_A2|EG_A3|any", "dataName": "MATS_Q2", "dataValue": "PostTest:Sg2", "dataSrc": "sceneState.SMatsPost1", "dataConstr": "" },
        { "Cond": "EG_A1|EG_A2|EG_A3|any", "dataName": "MATS_Q3", "dataValue": "PostTest:Sg3", "dataSrc": "sceneState.SMatsPost1", "dataConstr": "" },
        { "Cond": "EG_A1|EG_A2|EG_A3|any", "dataName": "MATS_Q4", "dataValue": "PostTest:Sg4", "dataSrc": "sceneState.SMatsPost1", "dataConstr": "" },
        { "Cond": "EG_A1|EG_A2|EG_A3|any", "dataName": "MATS_Q5", "dataValue": "PostTest:Sg1", "dataSrc": "sceneState.SMatsPost2", "dataConstr": "" },
        { "Cond": "EG_A1|EG_A2|EG_A3|any", "dataName": "MATS_Q6", "dataValue": "PostTest:Sg2", "dataSrc": "sceneState.SMatsPost2", "dataConstr": "" },
        { "Cond": "EG_A1|EG_A2|EG_A3|any", "dataName": "MATS_Q7", "dataValue": "PostTest:Sg3", "dataSrc": "sceneState.SMatsPost2", "dataConstr": "" },
        { "Cond": "EG_A1|EG_A2|EG_A3|any", "dataName": "MATS_Q8", "dataValue": "PostTest:Sg4", "dataSrc": "sceneState.SMatsPost2", "dataConstr": "" },
        { "Cond": "EG_A1|EG_A2|EG_A3|any", "dataName": "MATS_Q9", "dataValue": "PostTest:Sg1", "dataSrc": "sceneState.SMatsPost3", "dataConstr": "" },
        { "Cond": "EG_A1|EG_A2|EG_A3|any", "dataName": "MATS_Q10", "dataValue": "PostTest:Sg2", "dataSrc": "sceneState.SMatsPost3", "dataConstr": "" },
        { "Cond": "EG_A1|EG_A2|EG_A3|any", "dataName": "MATS_Q11", "dataValue": "PostTest:Sg3", "dataSrc": "sceneState.SMatsPost3", "dataConstr": "" },
        { "Cond": "EG_A1|EG_A2|EG_A3|any", "dataName": "MATS_Q12", "dataValue": "PostTest:Sg4", "dataSrc": "sceneState.SMatsPost3", "dataConstr": "" },
        { "Cond": "EG_A1|EG_A2|EG_A3|any", "dataName": "MATS_Q13", "dataValue": "PostTest:Sg1", "dataSrc": "sceneState.SMatsPost4", "dataConstr": "" },
        { "Cond": "EG_A1|EG_A2|EG_A3|any", "dataName": "MATS_Q14", "dataValue": "PostTest:Sg2", "dataSrc": "sceneState.SMatsPost4", "dataConstr": "" },
        { "Cond": "EG_A1|EG_A2", "dataName": "SCENE1_START", "dataValue": "", "sceneId": "SScene1", "dataSrc": "scene.$seq.prop|complete", "dataConstr": "scene.$seq.value|false" },
        { "Cond": "EG_A1|EG_A2", "dataName": "SCENE1_END", "dataValue": "", "sceneId": "SScene1", "dataSrc": "scene.$seq.prop|complete", "dataConstr": "scene.$seq.value|false" }
    ]
};
exports.TData_MATSPST = TData_MATSPST;
//# sourceMappingURL=TData_MATSPST.js.map