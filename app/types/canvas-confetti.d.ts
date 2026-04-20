declare module "canvas-confetti" {
  type GlobalOptions = {
    useWorker?: boolean;
    resize?: boolean;
    disableForReducedMotion?: boolean;
    zIndex?: number;
  };

  type Origin = {
    x?: number;
    y?: number;
  };

  type Shape =
    | "square"
    | "circle"
    | "star"
    | "triangle"
    | "line";

  type Options = {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: Origin;
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
    colors?: string[];
    shapes?: Shape[];
  };

  type ConfettiInstance = (options?: Options) => Promise<null>;

  interface ConfettiFunction {
    (options?: Options): Promise<null>;
    create(
      canvas?: HTMLCanvasElement | null,
      options?: GlobalOptions
    ): ConfettiInstance;
    reset(): void;
  }

  const confetti: ConfettiFunction;
  export default confetti;
}