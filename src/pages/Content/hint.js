class Potion {
  index
  /**
   * 0 deep sea
   * 1 distinct 2
   * 2 steal
   * 3 take 1
   * 4 any 3
   * 5 reuse
   * 6 line up
   * 7 remove same
   * 8
   */
  type
  combination; // Combination
  importance; // num value of the importance of potion, MUST be a postive number!
  constructor(index, combination, type, importance = 1) {
    this.index = index;
    this.combination = combination;
    this.type = type;
    console.assert(importance > 0, 'importance must be a postive number');
    this.importance = importance;
  }
}

/**
 * A group of balls, can be the ingredient of a potion or the exploded ones.
 */
class Combination {
  red = 0; // number of red balls
  black = 0; // number of green balls
  blue = 0; // number of yellow balls
  yellow = 0; // number of black balls

  constructor(red = 0, black = 0, blue = 0, yellow = 0) {
    this.red = red;
    this.black = black;
    this.blue = blue;
    this.yellow = yellow;
  }

  add(index, count = 1) {
    switch (index) {
      case 0:
        this.red += count;
        break;
      case 1:
        this.black += count;
        break;
      case 2:
        this.blue += count;
        break;
      case 3:
        this.yellow += count;
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

    ;['red', 'black', 'blue', 'yellow'].forEach((key, keyIndex) => {
      const tc = target[key], cc = this[key];
      if (tc > cc) {
        res.add(keyIndex, tc - cc);
        canFill = false;
      } else {
        leftOver += cc - tc;
      }
    });
    return new MatchResult(res, leftOver, canFill, ballResult);
  }
}

/**
 * Final predict result
 */
class FinalResult {
  actions = [];
  totalCombo;

  constructor(actions, totalCombo) {
    this.actions = actions;
    this.totalCombo = totalCombo;
  }
}

/**
 * how much two combination matches
 */
class MatchResult {
  // a combination indicating the balls required in case it can't be filled
  leftCombination
  // importance of the target potion
  importance

  // number indicates the total numbers of balls left over after we fill the target
  // (I think it's not important to know each kind of balls that are left over).
  leftOver
  canFill

  ballResult
  potion

  rowIndex

  constructor(leftCombination, leftOver, canFill, ballResult) {
    this.leftCombination = leftCombination;
    this.leftOver = leftOver;
    this.canFill = canFill;
    this.ballResult = ballResult;
  }

  // Here is how we compare
  // first we see if the target potion can be filled
  // then we if both position results in our target potion being filled
  // we rank the results by the importance of the target potion
  // then if both potions are of the same importance
  // we rank the results by if help is used.
  // at last, we rank the results by the balls left over.
  static compare(a, b) {
    return a.canFill > b.canFill ? -1 : a.canFill < b.canFill ? 1 :
      a.ballResult.takeFirst.length < b.ballResult.takeFirst.length ? - 1 :
        a.ballResult.takeFirst.length > b.ballResult.takeFirst.length ? -1 :
          a.leftOver > b.leftOver ? -1 : 1;
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
    this.takeLast = takeLast;
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
    takeOnes: 1,
  }) {
    this.index = index;
    this.size = balls.length;
    this.reset(balls, option);
  }

  /**
   * Reset the balls array together with the choices,
   * `takeOnes` indicates if how much times we can remove an extra one, defaults to 1 since it is always allowed to get help.
   * `start` defaults to 1 because we can't choose the first one.
   */
  reset(
    balls,
    option = {
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
    // can't select the last one when size is full
    for (let i = 0; i < this.size - (this.size === 9); i++) {
      const currentResult = new BallResult(new Combination(), [], [i,this.balls[i]]);
      currentResult.combination.add(this.balls[i])
      this._rgenerate(i - 1, i + 1, this.balls, option.takeOnes, currentResult, this.choices[i])
    }
  }

  // backtrack
  _rgenerate(downIndex, upIndex, balls, takeOnes, currentResult, results) {
    if (downIndex === -1 || upIndex === balls.length) {
      this._addResult(currentResult, results);
      return;
    }

    const down = this.balls[downIndex], up = this.balls[upIndex];
    if (down !== up) {
      if (takeOnes > 0) {
        // try remove down
        currentResult.combination.add(down)
        currentResult.takeFirst.push([downIndex, down])
        this._rgenerate(downIndex - 1, upIndex, balls, takeOnes - 1, currentResult, results);
        currentResult.combination.add(down, -1)
        currentResult.takeFirst.splice(-1, 1);

        // try remove up
        currentResult.combination.add(up)
        currentResult.takeFirst.push([upIndex, up])
        this._rgenerate(downIndex, upIndex + 1, balls, takeOnes - 1, currentResult, results);
        currentResult.combination.add(up, -1)
        currentResult.takeFirst.splice(-1, 1);
      } else {
        this._addResult(currentResult, results);
      }
    } else {
      let addedCount = 0;
      while (downIndex > -1) {
        if (this.balls[downIndex] !== down) break;
        addedCount += 1
        downIndex -= 1
      }

      while (upIndex < this.balls.length) {
        if (this.balls[upIndex] !== down) break;
        addedCount += 1
        upIndex += 1
      }

      currentResult.combination.add(down, addedCount)
      this._rgenerate(downIndex, upIndex, balls, takeOnes, currentResult, results);
      currentResult.combination.add(down, -addedCount)
    }
  }

  _addResult(ballResult, results) {
    const combination = ballResult.combination;
    results.push(new BallResult(new Combination(combination.red, combination.black, combination.blue, combination.yellow), [...ballResult.takeFirst], [...ballResult.takeLast]))
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
  *   1. cache results or existing potions if input doesn't change
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
  * @return FinalResult
  */
  predict({ rows, toFills = [], toNotFills = [], takeOnes, maxResults }) {
    this.rows = rows.map((row, index) => new Row(index, row, { takeOnes }));
    const results = [];

    // summary of total balls count in the result to get which color
    // should be chosen for the next potion
    const totalCombo = new Combination();
    this.rows.forEach((row, rowIndex) => {
      row.choices.forEach(ballResults => {
        ballResults.forEach(ballResult => {
          toFills.forEach(toFill => {
            const matchResult = ballResult.combination.match(toFill.combination, ballResult);
            matchResult.importance = toFill.importance;
            matchResult.potion = toFill;
            matchResult.rowIndex = rowIndex;
            totalCombo.add(0, ballResult.combination.red);
            totalCombo.add(1, ballResult.combination.black);
            totalCombo.add(2, ballResult.combination.blue);
            totalCombo.add(3, ballResult.combination.yellow);
            results.push(matchResult);
          });
        });
      });
    });

    results.sort(MatchResult.compare);
    console.log(results);
    return new FinalResult(results.splice(0, maxResults).map(matchResult =>
      new Action(matchResult.ballResult.takeFirst, matchResult.ballResult.takeLast, matchResult.rowIndex, matchResult.potion)
    ), totalCombo)
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
  rowIndex
  potion

  constructor(takeFirst, takeLast, rowIndex, potion) {
    this.takeFirst = takeFirst;
    this.takeLast = takeLast;
    this.rowIndex = rowIndex;
    this.potion = potion;
  }
  getLog() {
    let takeFirstStr = this.takeFirst.map(([index, color]) => index).join(',');
    if (takeFirstStr) {
      takeFirstStr = `removing ${takeFirstStr} and `;
    }
    let res = `In row ${this.rowIndex}, ${takeFirstStr}take ${this.takeLast[0]}`;
    return res;
  }
}

/**
 * Adjusted simple entry function to get hint by certain settings.
 *
 * Do not consider enemy potions.
 * @param takeOnes how many single balls can you get independently
 * @param fillLeft should filling left potion be one of the targets
 * @param fillRight should filling left potion be one of the targets
 */
export const getHint = ({ takeOnes, fillLeft, fillRight, maxResults }) => {
  let toFills = [], toNotFills = [], rows = [[], [], [], [], []];
  const factory = new Factory();

  rows = DOMHelper.getRails();
  if (fillLeft) {
    toFills.push(DOMHelper.getPotion(0));
  }

  if (fillRight) {
    toFills.push(DOMHelper.getPotion(1));
  }

  return factory.predict({ rows, toFills, toNotFills, takeOnes, maxResults });
}

class DOMHelper {
  static q(selector) {
    const res = document.querySelector(selector);
    if (!res)
      throw new Error(`DOM Exception: element ${selector} not found`);
    return res
  }

  static qa(selector) {
    const res = document.querySelectorAll(selector);
    if (!res)
      throw new Error(`DOM Exception: elements ${selector} not found`);
    return res
  }

  static getRails() {
    const rowWidth = 5, rowHeight = 9;
    return Array.from({ length: rowWidth }).map((_, i) =>
      Array.from({ length: rowHeight }).map((_, j) =>
        DOMHelper.getBallColor(DOMHelper.q(`#square_${i + 1}_${j} .marble`))
      )
    );
  }

  // 0 1 2 3 red black blue yellow
  static PotionMap = [
    '2020 0122 4020 0421 0220 2201 2040 1204 1102 0032 0231 4300 2002 2210 0204 2140'.split(' '),
    '2011 2300 1320 0034 0202 1022 0420 4012 1210 0203 2103 3040 0121 3020 3012 0430'.split(' '),
    '2200 0230 4011 0214'.split(' '),
  ]

  static _getPotionCombination(el) {
    const combo = new Combination();
    const { backgroundPositionX, backgroundPositionY } = window.getComputedStyle(el);
    const i = Math.round(Number(backgroundPositionY.replace('%', '') * 7 / 100));
    const j = Math.round(Number(backgroundPositionX.replace('%', '') * 15 / 100));
    ;[...DOMHelper.PotionMap[i][j]].forEach((count, color) => {
      combo.add(color, Number(count));
    })
    return [combo, Math.floor((i * 15 + j) / 4)];
  }

  static getBallColor(el) {
    const backgroundPositionX = window.getComputedStyle(el).backgroundPositionX.replace('%', '');
    // different game mode use different sprite map
    return ((['0px', '20', '40', '60'].indexOf(backgroundPositionX) + 1) || ('0361'.indexOf(backgroundPositionX[0]) + 1)) - 1;
  }

  static getPotion(index) {
    const [combo, type] = DOMHelper._getPotionCombination(DOMHelper.qa('.potion_image')[index]);

    // minus those that are already filled
    ;[...DOMHelper.qa('.potion_container')[index].querySelectorAll('.marble')].forEach(e => {
      combo.add(DOMHelper.getBallColor(e), -1);
    })

    return new Potion(index, combo, type);
  }
}
