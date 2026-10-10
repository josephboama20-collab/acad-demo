import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {applySM2,isDue} from '../src/utils/sm2.js';
import {computeGpaFromGrades} from '../src/utils/semesterUtils.js';
import {getMaxCourses,canAddCourse,getEnabledTools} from '../src/utils/planCapacity.js';
import {hasMinimumAcademicSetup,minimumSemesterHistoryRequirement,validateInstitutionName,validateProgramName} from '../src/utils/onboardingValidation.js';
import {syncFlashcardsFromLoggedCourses} from '../src/utils/flashcardsFromCourses.js';
import {getSemesterAddStatus,canSelectSemester} from '../src/utils/semesterAccess.js';
import {getPlanTimeline} from '../src/utils/planTimeline.js';
import {buildAcademicReport} from '../src/utils/academicReport.js';
const NativeDate=Date; const fixed='2026-10-10T12:00:00.000Z';
globalThis.Date=class extends NativeDate {constructor(...args){super(...(args.length?args:[fixed]));}static now(){return NativeDate.parse(fixed);}};
let records=[];
function test(id,description,expected,fn){try{const actual=fn();assert.deepEqual(actual,expected);records.push({id,description,expected,actual,status:'PASS'});}catch(e){records.push({id,description,expected,status:'FAIL',error:e.message});}}
for(const [duration,cap] of [['2–3 weeks',1],['1 month (4 weeks)',2],['2 months (8 weeks)',4],['3 months (12+ weeks)',6]]){
 test('CAP'+cap,'Capacity '+duration,cap,()=>getMaxCourses({duration}));
 test('BOUND'+cap,'At-limit rejection '+duration,false,()=>canAddCourse({duration},cap));
 test('UNDER'+cap,'Below-limit acceptance '+duration,true,()=>canAddCourse({duration},cap-1));
}
test('ZERO','Zero-course tools',['dashboard','courses','semester-journey'],()=>getEnabledTools({duration:'3 months (12+ weeks)'},0));
for(const [id,card,rating,expected] of [
 ['SM01',{easeFactor:2.5,repetitions:0},4,[1,1,2.5,'2026-10-11','learning']],
 ['SM02',{easeFactor:2.5,repetitions:1,interval:1},5,[6,2,2.6,'2026-10-16','reviewing']],
 ['SM03',{easeFactor:2.5,repetitions:2,interval:6},4,[15,3,2.5,'2026-10-25','reviewing']],
 ['SM04',{easeFactor:2.5,repetitions:3,interval:15},2,[1,0,2.18,'2026-10-11','learning']],
 ['SM05',{easeFactor:1.3,repetitions:3,interval:15},1,[1,0,1.3,'2026-10-11','learning']],
 ['SM06',{easeFactor:2.5,repetitions:4,interval:15},4,[38,5,2.5,'2026-11-17','mastered']]]){
 test(id,'SM-2 rating '+rating,expected,()=>{let c=applySM2(card,rating);return [c.interval,c.repetitions,c.easeFactor,c.nextReview,c.masteryLevel];});
}
test('DUE01','Card due today',true,()=>isDue({nextReview:'2026-10-10'}));
test('DUE02','Future card',false,()=>isDue({nextReview:'2026-10-11'}));
test('DUE03','Missing review date',true,()=>isDue({}));
const grades=[{grade:'A',credits:3},{grade:'C',credits:1}];
test('GPA01','Corrected credit-weighted GPA',3.5,()=>computeGpaFromGrades(grades));
test('GPA02','Empty GPA',null,()=>computeGpaFromGrades([]));
test('GPA03','Unknown grade ignored',4,()=>computeGpaFromGrades([{grade:'A',credits:3},{grade:'X',credits:2}]));
test('GPA04','Institutional weighted reference',3.5,()=>grades.reduce((a,c)=>a+({A:4,C:2}[c.grade])*c.credits,0)/4);
const answers={universityName:'University of Ghana',programName:'BSc Information Technology',country:'Ghana',trackType:'Single major',studentPath:'continuing'};
test('ON01','Unconfirmed programme gate',false,()=>hasMinimumAcademicSetup(answers,{},true,false));
test('ON02','Confirmed programme gate',true,()=>hasMinimumAcademicSetup(answers,{},true,true));
test('ON03','Missing country',false,()=>hasMinimumAcademicSetup({...answers,country:''},{},true,true));
test('ON04','Short institution rejected',false,()=>validateInstitutionName('UG').ok);
test('ON05','Short programme rejected',false,()=>validateProgramName('IT').ok);
test('ON06','Two grades insufficient',false,()=>minimumSemesterHistoryRequirement({s:{a:'A',b:'B'}},[{id:'s',type:'semesterGrades'}]).ok);
test('ON07','Three grades sufficient',true,()=>minimumSemesterHistoryRequirement({s:{a:'A',b:'B',c:'C'}},[{id:'s',type:'semesterGrades'}]).ok);
const history=[{courses:[{code:'DCIT101',name:'Intro'},{code:'DCIT102',name:'Computer systems'}]},{courses:[{code:'DCIT101',name:'Intro'}]}];
let seeded=syncFlashcardsFromLoggedCourses(history,[]);
test('SEED01','Two unique courses seed ten cards',10,()=>seeded.length);
test('SEED02','Repeat seeding has no duplicates',10,()=>syncFlashcardsFromLoggedCourses(history,seeded).length);
test('SEED03','Preserve reviewed card',7,()=>syncFlashcardsFromLoggedCourses(history,seeded.map((c,i)=>i===0?{...c,repetitions:7}:c))[0].repetitions);
const active={duration:'1 month (4 weeks)',startedAt:fixed};
const ended={...active,startedAt:'2026-09-01T12:00:00.000Z'};
test('TERM01','Active plan blocks semester addition',true,()=>getSemesterAddStatus(200,1,[],active).blockedByTimeline);
test('TERM02','Ended plan allows missing completed term',true,()=>getSemesterAddStatus(200,1,[],ended).canAdd);
test('TERM03','Logged past term selectable',true,()=>canSelectSemester(100,1,200,1,[{level:100,semester:1}]));
test('TERM04','Future term unselectable',false,()=>canSelectSemester(300,1,200,1,[]));
test('TIME01','28-day plan duration',28,()=>getPlanTimeline(active).totalDays);
test('TIME02','Ended plan',true,()=>getPlanTimeline(ended).isEnded);
const topics=[{topicId:'t1',name:'First',courseCode:'DCIT101',masteryLevel:40,lastStudied:'2026-10-02T12:00:00Z'},{topicId:'t2',name:'Second',courseCode:'DCIT101',masteryLevel:60,lastStudied:fixed}];
const report=buildAcademicReport({courses:[{courseId:'c1',code:'DCIT101',name:'Intro',topics}],allTopics:topics,weakTopics:[topics[0]],cards:[{masteryLevel:'learning'},{masteryLevel:'reviewing'}],dueCards:[{}],masteryMap:{mastered:0},habitLogs:[],streak:{current:0,best:0},metrics:{tasksCompleted:0},profile:{startedAt:fixed}});
test('REPORT01','Average topic mastery',50,()=>report.kpis.avgMastery);
test('REPORT02','One stale topic',1,()=>report.staleTopics.length);
test('REPORT03','One below-60 topic',1,()=>report.courseRows[0].below60);
mkdirSync('test-output', { recursive: true });
writeFileSync('test-output/functional-results.json',JSON.stringify({fixedClock:fixed,sourceScope:'working release; record published commit separately',records},null,2));
console.log(JSON.stringify({passed:records.filter(r=>r.status==='PASS').length,failed:records.filter(r=>r.status==='FAIL').length,failures:records.filter(r=>r.status==='FAIL')},null,2));

if (records.some((r) => r.status === 'FAIL')) process.exitCode = 1;
