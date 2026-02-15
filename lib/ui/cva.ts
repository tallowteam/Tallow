export interface CvaConfig {
  variants?: Record<string, Record<string, string | undefined>>;
  defaultVariants?: Record<string, string>;
}

export interface CvaInput {
  className?: string;
  [variantName: string]: string | null | undefined;
}

export function cva(baseClass: string | undefined, config: CvaConfig = {}) {
  const variants = config.variants ?? {};
  const defaultVariants = config.defaultVariants ?? {};

  return (input: CvaInput = {}) => {
    const classNames = [baseClass ?? ''];

    for (const variantName of Object.keys(variants)) {
      const selectedValue = input[variantName] ?? defaultVariants[variantName];
      if (!selectedValue) {
        continue;
      }

      const selectedClass = variants[variantName]?.[selectedValue];
      if (selectedClass) {
        classNames.push(selectedClass);
      }
    }

    if (input.className) {
      classNames.push(input.className);
    }

    return classNames.filter(Boolean).join(' ');
  };
}
