/**
 * ScrambleText —— Vue 3 适配层。
 *
 * import { ScrambleText } from "scramble-type/vue";
 * <ScrambleText text="ACCESS GRANTED" :speed="24" @done="..." />
 *
 * Props 与 React 版同名同默认值；事件：@done / @tick。
 * 通过模板 ref 可调用 replay() / skip()。
 */

import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
} from "vue";
import {
  createScramble,
  prefersReducedMotion,
  type ScrambleHandle,
  type ScrambleOptions,
} from "../core";
import { createTickSound, unlockAudio } from "../sound";

const NBSP = "\u00A0";

export type ScrambleLayout = "underlay" | "nbsp" | "none";

export interface ScrambleTextExposed {
  replay(): void;
  skip(): void;
}

export const ScrambleText = defineComponent({
  name: "ScrambleText",
  props: {
    text: { type: String, required: true },
    /** false 时不启动动画：渲染动画前的占位状态，用于阶段门控 */
    active: { type: Boolean, default: true },
    /** 宽度稳定策略：underlay（默认）/ nbsp / none，语义同 React 版 */
    layout: {
      type: String as PropType<ScrambleLayout>,
      default: "underlay",
    },
    speed: { type: Number, default: undefined },
    delay: { type: Number, default: undefined },
    churn: { type: Array as unknown as PropType<[number, number]>, default: undefined },
    glyphs: { type: String, default: undefined },
    maxChars: { type: Number, default: undefined },
    maxDuration: { type: Number, default: undefined },
    respectReducedMotion: { type: Boolean, default: true },
    /** 解码期间播放内置合成打字音 */
    sound: { type: Boolean, default: false },
    /** 宿主标签，默认 "span" */
    tag: { type: String, default: "span" },
  },
  emits: {
    done: () => true,
    tick: () => true,
  },
  setup(props, { emit, expose }) {
    const chars = computed(() => Array.from(props.text));
    const longText = computed(() =>
      props.maxChars !== undefined
        ? props.maxChars <= 0 || chars.value.length > props.maxChars
        : chars.value.length > 200,
    );
    const out = ref<string>(longText.value ? props.text : NBSP.repeat(chars.value.length));

    let engine: ScrambleHandle | null = null;
    let tick: (() => void) | null = null;

    function stop() {
      engine?.dispose();
      engine = null;
    }

    function sync() {
      stop();
      if (longText.value) {
        out.value = props.text;
        return;
      }
      if (!props.active) return;
      if (props.respectReducedMotion && prefersReducedMotion()) {
        out.value = props.text;
        emit("done");
        return;
      }
      const opts: ScrambleOptions = {
        speed: props.speed,
        delay: props.delay,
        churn: props.churn,
        glyphs: props.glyphs,
        maxChars: props.maxChars,
        maxDuration: props.maxDuration,
      };
      engine = createScramble(
        {
          onFrame: (s) => {
            out.value = s;
          },
          onTick: () => {
            emit("tick");
            if (props.sound) {
              tick ??= createTickSound();
              tick();
            }
          },
          onDone: () => emit("done"),
        },
        opts,
      );
      engine.start(props.text);
    }

    onMounted(() => {
      if (props.sound) unlockAudio();
      sync();
    });
    watch(
      () => [
        props.text,
        props.active,
        props.speed,
        props.delay,
        props.churn,
        props.glyphs,
        props.maxChars,
        props.maxDuration,
        props.respectReducedMotion,
      ],
      sync,
    );
    onBeforeUnmount(stop);

    expose<ScrambleTextExposed>({
      replay() {
        engine?.start(props.text);
      },
      skip() {
        engine?.skip();
      },
    });

    return () => {
      const underlay = props.layout === "underlay";
      const isSpan = props.tag === "span";
      const hostStyle: Record<string, string> = underlay
        ? { position: "relative", ...(isSpan ? { display: "inline-block" } : {}) }
        : {};
      const children = underlay
        ? [
            h("span", { style: { visibility: "hidden" } }, props.text),
            h("span", {
              "aria-hidden": true,
              style: { position: "absolute", inset: "0" },
            }, out.value),
          ]
        : [h("span", { "aria-hidden": true }, out.value)];
      return h(
        props.tag,
        { "aria-label": props.text, style: hostStyle },
        children,
      );
    };
  },
});
