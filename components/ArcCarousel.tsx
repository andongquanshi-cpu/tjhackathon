"use client";

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";

export type ArcPerson = {
  name: string;
  image: string;
  title: string;
  description: string;
  id?: string;
};

type ArcCarouselProps = {
  people: ArcPerson[];
  renderMedia?: (person: ArcPerson, index: number) => ReactNode;
  /** scrapbook 模式：自定义卡片内容（优先于整图） */
  renderCard?: (person: ArcPerson, index: number) => ReactNode;
  onSelect?: (person: ArcPerson, index: number) => void;
  onActiveChange?: (person: ArcPerson, index: number) => void;
  selectLabel?: string;
  className?: string;
  tableLabel?: string;
  tableHint?: string;
  /** 主界面：整张撕边纸片介绍卡 */
  variant?: "default" | "scrapbook";
};

const STEP = 180;
const DRAG_CLICK_THRESHOLD = 10;

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function shortestDiff(index: number, active: number, length: number) {
  return index - active - length * Math.round((index - active) / length);
}

export default function ArcCarousel({
  people,
  renderMedia,
  renderCard,
  onSelect,
  onActiveChange,
  selectLabel = "选择进入深聊",
  className = "",
  tableLabel = "ROUND TABLE",
  tableHint = "把最触动你的话拖到中间",
  variant = "default",
}: ArcCarouselProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const peopleRef = useRef(people);
  const onActiveChangeRef = useRef(onActiveChange);
  const onSelectRef = useRef(onSelect);
  const goByRef = useRef<(delta: number) => void>(() => {});
  const [activeIndex, setActiveIndex] = useState(0);
  const isScrapbook = variant === "scrapbook";

  peopleRef.current = people;
  onActiveChangeRef.current = onActiveChange;
  onSelectRef.current = onSelect;

  const activePerson = people[activeIndex] ?? people[0];
  const count = people.length;

  const emitActive = useCallback((index: number) => {
    const next = wrapIndex(index, peopleRef.current.length);
    setActiveIndex(next);
    const person = peopleRef.current[next];
    if (person) onActiveChangeRef.current?.(person, next);
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || count === 0) return;

    gsap.registerPlugin(Draggable, InertiaPlugin);

    const proxy = document.createElement("div");
    gsap.set(proxy, { x: 0 });
    const cards = cardRefs.current.filter(Boolean) as HTMLButtonElement[];
    let dragging = false;
    let startX = 0;

    const layout = () => {
      const width = stage.offsetWidth;
      const height = stage.offsetHeight;
      const progress = -Number(gsap.getProperty(proxy, "x")) / STEP;

      cards.forEach((card, index) => {
        const delta = shortestDiff(index, progress, count);

        if (isScrapbook) {
          // 封面流：左右轻推开，避免整圆背面卡片被裁成「半截」
          const absDelta = Math.abs(delta);
          const spacing = Math.max(128, Math.min(width * 0.24, 210));
          const scale = gsap.utils.mapRange(0, 1.6, 1.02, 0.78, Math.min(absDelta, 1.6));
          const opacity =
            absDelta > 1.55
              ? 0
              : gsap.utils.mapRange(0, 1.55, 1, 0.42, absDelta);
          const rotateY = gsap.utils.clamp(-32, 32, delta * -18);
          const rotateZ = gsap.utils.clamp(-3, 3, delta * -1.2);
          const y = absDelta * absDelta * 6;

          gsap.set(card, {
            xPercent: -50,
            yPercent: -50,
            x: delta * spacing,
            y,
            z: -absDelta * 120,
            rotationY: rotateY,
            rotationZ: rotateZ,
            scale,
            opacity,
            zIndex: Math.round(50 - absDelta * 12),
            transformOrigin: "50% 50%",
            transformPerspective: 1200,
            force3D: true,
            visibility: absDelta > 1.6 ? "hidden" : "visible",
          });
        } else {
          const radiusX = Math.max(160, Math.min(width * 0.42, 520));
          const radiusY = Math.max(48, Math.min(height * 0.22, 96));
          const theta = Math.PI + (delta / count) * Math.PI * 2;
          const depth = gsap.utils.clamp(-1, 1, -Math.cos(theta));
          const scale = gsap.utils.mapRange(-1, 1, 0.68, 1.04, depth);
          const opacity = gsap.utils.mapRange(-1, 1, 0.42, 1, depth);

          gsap.set(card, {
            xPercent: -50,
            yPercent: -50,
            x: radiusX * Math.sin(theta),
            y: radiusY * Math.cos(theta),
            z: 0,
            rotationY: 0,
            rotationZ: 0,
            scale,
            opacity,
            zIndex: Math.round(40 + depth * 40),
            transformOrigin: "50% 55%",
            transformPerspective: 0,
            force3D: true,
          });
        }

        card.dataset.active = Math.abs(delta) < 0.5 ? "true" : "false";
        card.setAttribute("aria-current", Math.abs(delta) < 0.5 ? "true" : "false");
      });
    };

    const snapActive = () => {
      const progress = -Number(gsap.getProperty(proxy, "x")) / STEP;
      emitActive(Math.round(progress));
    };

    const goTo = (index: number) => {
      const progress = -Number(gsap.getProperty(proxy, "x")) / STEP;
      const delta = shortestDiff(index, progress, count);
      gsap.killTweensOf(proxy);
      gsap.to(proxy, {
        x: Number(gsap.getProperty(proxy, "x")) - delta * STEP,
        duration: 0.55,
        ease: "power3.out",
        onUpdate: layout,
        onComplete: snapActive,
      });
    };

    goByRef.current = (delta: number) => {
      const progress = Math.round(-Number(gsap.getProperty(proxy, "x")) / STEP);
      goTo(wrapIndex(progress + delta, count));
    };

    cards.forEach((card, index) => {
      const onCardClick = () => {
        if (dragging) return;
        const progress = -Number(gsap.getProperty(proxy, "x")) / STEP;
        if (Math.abs(shortestDiff(index, Math.round(progress), count)) < 0.5) {
          const person = peopleRef.current[index];
          if (person) onSelectRef.current?.(person, index);
          return;
        }
        goTo(index);
      };
      card.addEventListener("click", onCardClick);
      (card as HTMLButtonElement & { __arcClick?: () => void }).__arcClick = onCardClick;
    });

    const [draggable] = Draggable.create(proxy, {
      trigger: stage,
      type: "x",
      inertia: true,
      dragResistance: 0.12,
      throwResistance: 2200,
      minDuration: 0.35,
      maxDuration: 1.15,
      allowContextMenu: true,
      zIndexBoost: false,
      onPress() {
        dragging = false;
        startX = this.x;
        gsap.killTweensOf(proxy);
      },
      onDrag() {
        if (Math.abs(this.x - startX) > DRAG_CLICK_THRESHOLD) dragging = true;
        layout();
      },
      onThrowUpdate: layout,
      onThrowComplete: snapActive,
      onDragEnd() {
        if (!this.tween) snapActive();
      },
      snap: {
        x: (value: number) => Math.round(value / STEP) * STEP,
      },
    });

    const onResize = () => layout();
    const observer = new ResizeObserver(onResize);
    observer.observe(stage);
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    layout();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      draggable.kill();
      gsap.killTweensOf(proxy);
      cards.forEach((card) => {
        const handler = (card as HTMLButtonElement & { __arcClick?: () => void }).__arcClick;
        if (handler) card.removeEventListener("click", handler);
      });
    };
  }, [count, emitActive, isScrapbook]);

  const peopleKey = useMemo(() => people.map((person) => person.name).join("|"), [people]);

  if (count === 0) return null;

  return (
    <div
      className={`arc-carousel ${isScrapbook ? "arc-carousel--scrapbook" : ""} ${className}`.trim()}
      ref={rootRef}
      data-people={peopleKey}
    >
      <div className="arc-carousel__viewport">
        <button
          type="button"
          className="arc-carousel__nav arc-carousel__nav--prev"
          aria-label="上一张卡片"
          onClick={() => goByRef.current(-1)}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div className="arc-carousel__stage" ref={stageRef}>
          {!isScrapbook && (
            <>
              <svg className="arc-carousel__path" viewBox="0 0 1000 280" aria-hidden="true">
                <ellipse cx="500" cy="210" rx="430" ry="88" />
              </svg>
              <div className="arc-carousel__table">
                <span>{tableLabel}</span>
                <p>{tableHint}</p>
              </div>
            </>
          )}
          {people.map((person, index) => (
            <button
              key={person.id ?? `${person.name}-${index}`}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
              type="button"
              className="arc-carousel__card"
              style={{ "--card-index": index } as CSSProperties}
              aria-label={`${person.name}，${person.title}：${person.description}`}
            >
              {isScrapbook ? (
                renderCard ? (
                  <span className="arc-carousel__scrap arc-carousel__scrap--component">
                    {renderCard(person, index)}
                  </span>
                ) : person.image ? (
                  <img
                    className="arc-carousel__scrap"
                    src={person.image}
                    alt=""
                    draggable={false}
                  />
                ) : null
              ) : (
                <>
                  <span className="arc-carousel__head">
                    <span className={`arc-carousel__media arc-carousel__media--${index % 4}`}>
                      {renderMedia ? (
                        renderMedia(person, index)
                      ) : person.image ? (
                        <img src={person.image} alt="" draggable={false} />
                      ) : (
                        <span className="arc-carousel__fallback">{person.name.slice(0, 1)}</span>
                      )}
                    </span>
                    <span className="arc-carousel__who">
                      <strong>{person.name}</strong>
                      <small>{person.title}</small>
                    </span>
                  </span>
                  <span className="arc-carousel__quote">{person.description}</span>
                </>
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="arc-carousel__nav arc-carousel__nav--next"
          aria-label="下一张卡片"
          onClick={() => goByRef.current(1)}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      {activePerson && onSelect && (
        <div className="arc-carousel__caption">
          <p>
            当前选中：{activePerson.name}。点中间卡片，或点下方按钮，到右侧一对一深聊。
          </p>
          <button
            type="button"
            className="primary-pill"
            onClick={() => onSelect(activePerson, activeIndex)}
          >
            {selectLabel} →
          </button>
        </div>
      )}
    </div>
  );
}
