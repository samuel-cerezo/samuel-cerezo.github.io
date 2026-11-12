export function gradeQuiz(questions,answers){
  const items=questions.map((q,i)=>({selected:Number.isInteger(answers[i])?answers[i]:null,correct:q.correct,ok:answers[i]===q.correct,states:q.options.map((_,n)=>n===q.correct?'correct':n===answers[i]?'selected-wrong':'neutral')}));
  return {items,score:items.filter(i=>i.ok).length,total:items.length};
}
