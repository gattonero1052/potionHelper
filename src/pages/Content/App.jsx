import { Button, Tag, notification, Tooltip } from 'antd';
import React, { forwardRef } from 'react';
import { useCallback, useState, useEffect, useRef } from 'react';
import { getHint } from './hint';

import './App.css';

const DEFAULTS = {
  MAX_HELP: 1,
  FILL_LEFT: 1,
  FILL_RIGHT: 1,
  MAX_RESULTS: 3,
};

const Actions = {
  SET_MAX_HELP: Symbol(),
  SET_MAX_RESULTS: Symbol(),
  SET_LEFT_CHECKED: Symbol(),
  SET_RIGHT_CHECKED: Symbol(),
  CLICK_HINT: Symbol(),
};

// animationType: flash or remove
const Ball = ({
  rowIndex,
  colIndex,
  animationType = 'flash',
  animationTrigger = 0,
}) => {
  const showAnimation = useCallback(() => {
    const ball = document.querySelector(
      `#tube_${rowIndex + 1} .marble_holder:nth-child(${colIndex + 1}) .marble`
    );
    ball.style.animationName = '';
    setTimeout(() => {
      ball.style.animationDuration = '1s';
      ball.style.animationIterationCount = '2';

      if (animationType === 'flash') {
        ball.style.animationName = 'flash';
      } else if (animationType === 'remove') {
        ball.style.animationName = 'remove';
      }
    });
  }, [animationType, rowIndex, colIndex]);

  useEffect(() => {
    if ((animationTrigger || 0) > 0) showAnimation();
  }, [animationTrigger, showAnimation]);
  return <Tag color="blue">{`(${rowIndex},${colIndex})`}</Tag>;
};

const Widget = forwardRef(({ hints, nextColor, actionCallback }, contentEl) => {
  const [helpCount, setHelpCount] = useState(DEFAULTS.MAX_HELP);
  const [resultsCount, setResultsCount] = useState(DEFAULTS.MAX_RESULTS);
  const [dragStartPosition, setDragStartPosition] = useState([0, 0]);
  const [animationTrigger, triggerAnimation] = useState([]);
  const nextColorTotal = nextColor
    ? nextColor.red + nextColor.black + nextColor.blue + nextColor.yellow
    : 0;
  const percentageStr = nextColor
    ? {
        red: (nextColor.red / nextColorTotal) * 100 + '%',
        black: (nextColor.black / nextColorTotal) * 100 + '%',
        blue: (nextColor.blue / nextColorTotal) * 100 + '%',
        yellow: (nextColor.yellow / nextColorTotal) * 100 + '%',
      }
    : '';

  return (
    <div ref={contentEl} className="helper-widget flex-c">
      <div
        className="title"
        draggable="true"
        onDragStart={({ clientX, clientY }) => {
          const { top, left } = contentEl.current.getBoundingClientRect();
          setDragStartPosition([clientX, clientY, top, left]);
        }}
        onDragOver={({ clientX, clientY }) => {
          console.log(clientX);
          requestAnimationFrame(() => {
            const [startX, startY, startTop, startLeft] = dragStartPosition;
            contentEl.current.style.left = `${startLeft + clientX - startX}px`;
            contentEl.current.style.top = `${startTop + clientY - startY}px`;
          });
        }}
      >
        Boardgame helper
      </div>
      <div className="header flex-c">
        <div className="flex">
          <div>
            <span className="label">Maximum helps:</span>
            <span className="value">{helpCount}</span>
          </div>
          <input
            onChange={(e) => {
              setHelpCount(e.target.value);
              actionCallback(Actions.SET_MAX_HELP, e.target.value);
            }}
            type="range"
            min="0"
            max="6"
            value={helpCount}
          />
        </div>
        <div className="flex">
          <span className="label">
            Potions you wants to fill:&nbsp;&nbsp;&nbsp;
          </span>
          <div style={{ transform: 'translateX(-.5rem)' }}>
            <label>
              Left&nbsp;&nbsp;
              <input
                type="checkbox"
                name="potion"
                defaultChecked="true"
                onChange={(e) => {
                  actionCallback(Actions.SET_LEFT_CHECKED, e.target.value);
                }}
              />
            </label>
            &nbsp;&nbsp;
            <label>
              Right&nbsp;&nbsp;
              <input
                type="checkbox"
                name="potion"
                defaultChecked="true"
                onChange={(e) => {
                  actionCallback(Actions.SET_RIGHT_CHECKED, e.target.value);
                }}
              />
            </label>
          </div>
        </div>
        <div className="flex">
          <div>
            <span className="label">Top #results:</span>
            <span className="value">{resultsCount}</span>
          </div>
          <input
            onChange={(e) => {
              setResultsCount(e.target.value);
              actionCallback(Actions.SET_MAX_RESULTS, e.target.value);
            }}
            type="range"
            min="1"
            max="10"
            value={resultsCount}
          />
        </div>
        <div className="flex" style={{ width: '100%', padding: '.5rem 0' }}>
          <Button
            style={{ width: '100%' }}
            type="primary"
            size="middle"
            onClick={() => {
              actionCallback(Actions.CLICK_HINT);
            }}
          >
            Hint
          </Button>
        </div>
      </div>
      <div className="body flex-c">
        {nextColor ? (
          <div className="color flex">
            <Tooltip
              placement="topRight"
              title={`The best choice for the next potion according to color combinations on the current tubes. Red: ${percentageStr.red}, Black: ${percentageStr.black}, Blue: ${percentageStr.blue}, Yellow: ${percentageStr.yellow}`}
              arrow={true}
            >
              <div className="flex" style={{ width: '100%' }}>
                <div
                  className="red"
                  style={{
                    width: percentageStr.red,
                  }}
                ></div>
                <div
                  className="black"
                  style={{
                    width: percentageStr.black,
                  }}
                ></div>
                <div
                  className="blue"
                  style={{
                    width: percentageStr.blue,
                  }}
                ></div>
                <div
                  className="yellow"
                  style={{
                    width: percentageStr.yellow,
                  }}
                ></div>
              </div>
            </Tooltip>
          </div>
        ) : null}
        <div className="hints flex-c">
          {hints.map((action, index) => {
            return (
              <div
                className="hint"
                onClick={() =>
                  triggerAnimation((v) => {
                    v[index] = (v[index] || 0) + 1;
                    return [...v];
                  })
                }
              >
                <div>
                  {action.takeFirst.length ? (
                    <>
                      <span>Take </span>
                      {action.takeFirst.map((colIndex) => (
                        <Ball
                          rowIndex={action.rowIndex}
                          colIndex={colIndex}
                          animationType={'remove'}
                          animationTrigger={animationTrigger[index]}
                        />
                      ))}
                      <span>{'. '}</span>
                    </>
                  ) : null}
                  {
                    <>
                      <span>Explode </span>
                      <Ball
                        rowIndex={action.rowIndex}
                        colIndex={action.takeLast}
                        animationType={'flash'}
                        animationTrigger={animationTrigger[index]}
                      />
                      <span>{'. '}</span>
                    </>
                  }
                  {
                    <span>{`Fill ${
                      action.potion.index ? 'Right' : 'Left'
                    }`}</span>
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

const Page = () => {
  const [api, contextHolder] = notification.useNotification();
  const [hints, setHints] = useState([]);
  const [nextColor, setNextColor] = useState(null);
  const option = useRef({
    takeOnes: DEFAULTS.MAX_HELP,
    fillLeft: DEFAULTS.FILL_LEFT,
    fillRight: DEFAULTS.FILL_RIGHT,
    maxResults: DEFAULTS.MAX_RESULTS,
  });
  const widgetRef = useRef(null);
  const showMessage = (message) => {
    api.info({
      message,
      placement: 'topLeft',
      duration: 0,
    });
  };
  return (
    <>
      {contextHolder}
      <Widget
        ref={widgetRef}
        hints={hints}
        nextColor={nextColor}
        actionCallback={(action, data) => {
          switch (action) {
            case Actions.SET_MAX_HELP:
              option.current.takeOnes = data;
              break;
            case Actions.SET_MAX_RESULTS:
              option.current.maxResults = data;
              break;
            case Actions.SET_LEFT_CHECKED:
              option.current.fillLeft = data;
              break;
            case Actions.SET_RIGHT_CHECKED:
              option.current.fillRight = data;
              break;
            case Actions.CLICK_HINT:
              let result = [];
              try {
                result = getHint(option.current);
                setNextColor(result.totalCombo);
                setHints([...result.actions]);
              } catch (e) {
                showMessage(e.message);
              }
              break;
            default:
              break;
          }
        }}
      />
    </>
  );
};

export default Page;
