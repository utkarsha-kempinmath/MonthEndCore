const normalize = (value, max) => {
  return max ? value / max : 0
}

exports.buildBehaviorProfile = (answers) => {

  let traits = {
    impulsivity: 0,
    planning: 0,
    emotionalSpending: 0,
    socialInfluence: 0
  }

  // q1
  if (answers.q1 === "A") {
    traits.impulsivity += 2
    traits.socialInfluence += 2
  } else if (answers.q1 === "B") {
    traits.planning += 1
  } else {
    traits.planning += 2
  }

  // q2
  if (answers.q2 === "A") {
    traits.impulsivity += 2
  } else if (answers.q2 === "B") {
    traits.planning += 1
  } else {
    traits.planning += 2
  }

  // q3
  if (answers.q3 === "A") {
    traits.emotionalSpending += 3
  } else if (answers.q3 === "B") {
    traits.emotionalSpending += 1
  }

  // q4
  if (answers.q4 === "A") {
    traits.socialInfluence += 3
  } else if (answers.q4 === "B") {
    traits.socialInfluence += 1
  }

  // q5
  if (answers.q5 === "A") {
    traits.impulsivity += 2
  } else if (answers.q5 === "B") {
    traits.planning += 1
  } else {
    traits.planning += 3
  }

  // q6
  if (answers.q6 === "A") {
    traits.impulsivity += 2
  } else if (answers.q6 === "B") {
    traits.planning += 1
  } else {
    traits.planning += 2
  }

  

  const normalize = (v) => Math.min(v / 6, 1)

  return {
    impulsivity: normalize(traits.impulsivity),
    planning: normalize(traits.planning),
    emotionalSpending: normalize(traits.emotionalSpending),
    socialInfluence: normalize(traits.socialInfluence)
  }
}