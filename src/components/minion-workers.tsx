"use client";

import React from "react";

type MinionAction = "hammer" | "carry" | "dig" | "push" | "paint" | "saw" | "measure" | "weld";

interface MinionProps {
  action: MinionAction;
  size?: "sm" | "md";
  delay?: number;
  flip?: boolean;
}

function MinionFigure({ action, size = "sm", delay = 0, flip = false }: MinionProps) {
  const scale = size === "sm" ? 0.7 : 1;
  const animClass = `minion-action-${action}`;
  const toolAnimClass = `minion-tool-${action}`;

  return (
    <div
      className={`minion-figure ${animClass} ${flip ? "scale-x-[-1]" : ""}`}
      style={{
        transform: `scale(${scale}) scaleX(${flip ? -1 : 1})`,
        animationDelay: `${delay}s`,
      }}
    >
      {/* Hard Hat */}
      <div className="minion-hard-hat">
        <div className="minion-hard-hat-dome" />
      </div>

      {/* Head / Body */}
      <div className="minion-body">
        {/* Goggles Strap */}
        <div className="minion-goggle-strap" />

        {/* Goggle(s) */}
        <div className="minion-goggles">
          <div className="minion-goggle-eye left">
            <div className="minion-pupil" />
          </div>
          <div className="minion-goggle-bridge" />
          <div className="minion-goggle-eye right">
            <div className="minion-pupil" />
          </div>
        </div>

        {/* Mouth */}
        <div className={`minion-mouth minion-mouth-${action}`} />

        {/* Overalls */}
        <div className="minion-overalls">
          <div className="minion-pocket" />
          {/* Overall straps */}
          <div className="minion-strap left" />
          <div className="minion-strap right" />
        </div>

        {/* Arms & Tools */}
        <div className={`minion-arm minion-arm-left minion-arm-left-${action}`}>
          <div className={`minion-tool ${toolAnimClass}`}>
            {renderTool(action)}
          </div>
        </div>
        <div className={`minion-arm minion-arm-right minion-arm-right-${action}`} />

        {/* Legs */}
        <div className="minion-legs">
          <div className={`minion-leg left ${action === "carry" || action === "push" ? "minion-leg-walk" : ""}`} />
          <div className={`minion-leg right ${action === "carry" || action === "push" ? "minion-leg-walk" : ""}`} style={{ animationDelay: `${delay + 0.3}s` }} />
        </div>
      </div>
    </div>
  );
}

function renderTool(action: MinionAction) {
  switch (action) {
    case "hammer":
      return <div className="minion-hammer" />;
    case "carry":
      return <div className="minion-box" />;
    case "dig":
      return <div className="minion-shovel" />;
    case "push":
      return <div className="minion-wheelbarrow" />;
    case "paint":
      return <div className="minion-paint-roller" />;
    case "saw":
      return <div className="minion-saw" />;
    case "measure":
      return <div className="minion-tape" />;
    case "weld":
      return <div className="minion-welder" />;
  }
}

const headerActions: MinionAction[] = ["hammer", "carry", "paint", "dig"];
const footerActions: MinionAction[] = ["saw", "measure", "push", "weld"];

interface MinionWorkersProps {
  position: "header" | "footer";
}

export function MinionWorkers({ position }: MinionWorkersProps) {
  const actions = position === "header" ? headerActions : footerActions;
  const delays = [0, 1.2, 2.4, 3.6];

  return (
    <div className={`minion-workers-container minion-workers-${position}`}>
      {actions.map((action, i) => (
        <MinionFigure
          key={`${position}-${action}-${i}`}
          action={action}
          size="sm"
          delay={delays[i]}
          flip={i % 2 === 1}
        />
      ))}
    </div>
  );
}
