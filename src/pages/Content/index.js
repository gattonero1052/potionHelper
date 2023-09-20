class Potion {
  index
  name
  combination; // Combination
  importance; // num value of the importance of potion, MUST be a postive number!
  constructor(index, name, combination, importance) {
    this.index = index;
    this.name = name;
    this.combination = combination;
    console.assert(importance > 0, 'importance must be a postive number');
    this.importance = importance;
  }
}

/**
 * A group of balls, can be the ingredient of a potion or the exploded ones.
 */
class Combination {
  r = 0; // number of red balls
  g = 0; // number of green balls
  y = 0; // number of yellow balls
  b = 0; // number of balck balls

  constructor(r, g, y, b) {
    this.r = r;
    this.g = g;
    this.y = y;
    this.b = b;
  }

  add(index, count = 1) {
    switch (index) {
      case 0 || 'r':
        this.r += count;
        break;
      case 1 || 'g':
        this.g += count;
        break;
      case 2 || 'y':
        this.y += count;
        break;
      case 3 || 'b':
        this.b += count;
        break;
      default:
        break;
    }
  }

  /**
   * how much the current combination matches the target combination
   * @return MatchResult
   *
   */
  match(target, ballResult) {
    const res = new Combination();
    let leftOver = 0;
    let canFill = true;

    ;[...'rgyb'].forEach(key => {
      const tc = target[key], cc = this[key];
      if (tc > cc) {
        res.add(key, tc - cc);
        canFill = false;
      } else {
        leftOver += cc - tc;
      }
    });
    return new MatchResult(res, leftOver, canFill, ballResult);
  }
}

/**
 * how much two combination matches
 */
class MatchResult {
  // a combination indicating the balls required in case it can't be filled
  combination
  // importance of the target potion
  importance

  // number indicates the total numbers of balls left over after we fill the target
  // (I think it's not important to know each kind of balls that are left over).
  leftOver
  canFill

  ballResult
  potion

  constructor(combination, leftOver, canFill, ballResult) {
    this.combination = combination;
    this.leftOver = leftOver;
    this.canFill = canFill;
    this.ballResult = ballResult;
  }

  // Here is how we compare
  // first we see if the target potion can be filled
  // then we if both position results in our target potion being filled
  // we rank the results by the importance of the target potion
  // then if both potions are of the same importance
  // we rank the results by the balls left over.
  static compare(a, b) {
    return a.canFill > b.canFill ? -1 : a.leftOver > b.leftOver ? -1 : 1;
  }
}

/**
 * How should we do for each ball(would be the center) to get the optimal result.
 * `combination` is the combination of balls we would get for the current ball.
 * `takeFirst` indicates the indices of ball we should take.
 */
class BallResult {
  combination;
  takeFirst;
  takeLast;

  constructor(combination, takeFirst, takeLast) {
    this.combination = combination;
    this.takeFirst = takeFirst;
  }
}

class Row {
  size = 0;
  balls = [];

  /**
   * BallResults[][], length should be equal to balls[],
   * choices[i] is an array of BallResult, each result means
   * 'take balls from indices `takeFirst` should result in a combination of `combination`'
   */
  choices = [];
  index;

  constructor(index, balls, option = {
    start: 1,
    takeOnes: 1,
  }) {
    this.index = index;
    this.size = balls.length;
    this.reset(balls);
  }

  /**
   * Reset the balls array together with the choices,
   * `takeOnes` indicates if how much times we can remove an extra one, defaults to 1 since it is always allowed to get help.
   * `start` defaults to 1 because we can't choose the first one.
   */
  reset(
    balls,
    option = {
      start: 1,
      takeOnes: 1,
    }
  ) {
    this.balls = balls;
    this.choices = Array.from(
      balls,
      () => []
    );
    this.generate(option);
  }

  /**
   * generate the optimal choice for each ball, according to the given options.
   */
  generate(option) {
    for (let i = option.start; i < this.size; i++) {
      const currentResult = new BallResult(new Combination(), [], i);
      currentResult.combination.add(this.balls[i])
      this._rgenerate(i - 1, i + 1, this.balls, option.takeOnes, currentResult, this.choices[i])
    }
  }

  // backtrack
  _rgenerate(upIndex, downIndex, balls, takeOnes, currentResult, results) {
    if (upIndex === -1 || downIndex === balls.length) {
      this._addResult(currentResult, results);
      return;
    }

    const up = this.balls[upIndex], down = this.balls[downIndex];
    if (up !== down) {
      if (takeOnes > 0) {
        // try remove up
        currentResult.combination.add(up)
        currentResult.takeFirst.push(up)
        this._rgenerate(upIndex - 1, downIndex, balls, takeOnes - 1, currentResult, results);
        currentResult.combination.add(up, -1)
        currentResult.takeFirst.splice(-1, 1);

        // try remove down
        currentResult.combination.add(down)
        currentResult.takeFirst.push(down)
        this._rgenerate(upIndex, downIndex + 1, balls, takeOnes - 1, currentResult, results);
        currentResult.combination.add(down, -1)
        currentResult.takeFirst.splice(-1, 1);
      } else {
        this._addResult(currentResult, results);
      }
    } else {
      currentResult.combination.add(up, 2)
      this._rgenerate(upIndex - 1, downIndex + 1, balls, takeOnes, currentResult, results);
      currentResult.combination.add(up, -2)
    }
  }

  _addResult(ballResult, results) {
    const combination = ballResult.combination;
    results.push(new BallResult(new Combination(combination.r, combination.g, combination.y, combination.b), [...ballResult.takeFirst]))
  }
}

/**
 * the potion factory where explode happens。
 */
class Factory {
  rows = [];

  /**
  *  output which ball we should take by requirements
  *  we want to fill our potions or unfill our opponents' potions.
  *  if both filled and unfilled are set, we want to first fill our potion
  *  then unfill our opponents potion.
  *  since this is a simple application, neither we have much data to calculate,
  *  nor we need a complex strategy.
  *
  *  we don't do
  *   1. cache results if input doesn't change
  *   2. init factory to give it a default state or default option
  *   3. deliberately pick the balls that would disrupt the opponent, just
  *   pick the balls they would want to pick because there might not be many
  *   chances for a good pick.
  *  we do
  *   1. recalculate the BallResults for each ball everytime we call this function
  *
  * @param rows: 2D array representing the potion factory
  * @param toFills: Potion[], which potion do you want to fill
  * @param toNotFills: Potion[], which potion do you don't want to fill
  * @param takeOnes: number, how many times can we take one ball from the panel
  * @return Action[]: array of sorted actions.
  */
  predict(rows, toFills = [], toNotFills = [], takeOnes = 1) {
    this.rows = rows.map((row, index) => new Row(index, row, { start: 1, takeOnes }));
    const results = [];
    this.rows.forEach(row => {
      row.choices.forEach(ballResult => {
        toFills.forEach(toFill => {
          const matchResult = ballResult.combination.match(toFill.combination, ballResult);
          matchResult.importance = toFill.importance;
          matchResult.potion = toFill;
          results.push(matchResult);
        });

        toNotFills.forEach(toNotFill => {
          const matchResult = ballResult.combination.match(toNotFill.combination, ballResult);
          matchResult.importance = -1 / toNotFill.importance;
          matchResult.potion = toNotFill;
          results.push(matchResult);
        });
      });
    });

    results.sort(MatchResult.compare);
    return results.map(matchResult =>
      new Action(matchResult.ballResult.takeFirst, matchResult.ballResult.takeLast, matchResult.potion)
    )
  }
}

/**
 * what action should we take to reach our goal
 * takeFirst: which balls shall we take first
 * takeLast: which ball shall we take last
 * potion: which potion shall we fill
 *
 * TODO add the capability to use "take from the deep sea" potion, indicating how many times it could be used
 * and which index should it be used against with. (apparently it should be used in the last step)
 * TODO add the capability to use "take two adjacent different balls" potions once,
 * this should be simplier, just traverse through all the possibilities, also
 * apparently it should be used in the first step.
 * (only one time because it would get extremely complex for the program and it's unnecessary,
 * we only want to know what the change could be for one of rows and then take the rest if we still have this kind of potion.)
 */
class Action {
  takeFirst = []
  takeLast
  potion
}


/***************************** DOM Bindings ******************************/
const Global = {
  helper: null,
};

; (function () {
  document.addEventListener('load', () => {
    const logArea = null, clearButton = null, predictButton = null, takeOnesInput = null;
    Global.helper = new Helper(logArea, clearButton, predictButton, takeOnesInput);
  });
})();

class Helper {
  logArea
  clearButton
  predictButton
  constructor(logArea, clearButton, predictButton, takeOnesInput) {
    this.logArea = logArea;
    this.clearButton = clearButton;
    this.predictButton = predictButton;
    this.takeOnesInput = takeOnesInput;
    clearButton.addEventListener('click', this.clearButton.bind(this));
    predictButton.addEventListener('click', this.predictButton.bind(this));
  }
  predict(takeOnes) {
    const myPotions = [], enemyPotions = [], rows = [[], [], [], [], []];
    // TODO crawl data from page elements

    const factory = new Factory();
    this.log(factory.predict(rows, myPotions, enemyPotions, Number(this.takeOnesInput.value || 1)));
  }
  log(actions) {
    // TODO design and implement how we show actions
  }
  clear() {
    // TODO implement how we clear actions info
  }
}
