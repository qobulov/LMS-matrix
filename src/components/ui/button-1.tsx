import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'cursor-pointer group inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-[color,box-shadow] ring-offset-background disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        mono: 'bg-zinc-950 text-white hover:bg-zinc-950/90 dark:bg-zinc-300 dark:text-black',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
        outline: 'border border-input bg-background text-accent-foreground hover:bg-accent',
        dashed: 'border border-dashed border-input bg-background text-accent-foreground hover:bg-accent',
        ghost: 'text-accent-foreground hover:bg-accent hover:text-accent-foreground',
        dim: 'text-muted-foreground hover:text-foreground',
        foreground: '',
        inverse: '',
      },
      appearance: {
        default: '',
        ghost: '',
      },
      underline: {
        solid: '',
        dashed: '',
      },
      underlined: {
        solid: '',
        dashed: '',
      },
      size: {
        lg: 'h-10 rounded-md px-4 gap-1.5 [&_svg]:size-4',
        md: 'h-9 rounded-md px-3 gap-1.5 [&_svg]:size-4',
        sm: 'h-7 rounded-md px-2.5 gap-1.25 text-xs [&_svg]:size-3.5',
        icon: 'size-9 rounded-md shrink-0 [&_svg]:size-4',
      },
      autoHeight: {
        true: '',
        false: '',
      },
      shape: {
        default: '',
        circle: 'rounded-full',
      },
      mode: {
        default: 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        icon: 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        link: 'h-auto rounded-none bg-transparent p-0 text-primary hover:bg-transparent',
        input:
          'justify-start font-normal hover:bg-background focus-visible:ring-2 focus-visible:ring-ring/30',
      },
      placeholder: {
        true: 'text-muted-foreground',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'primary',
        mode: 'default',
        appearance: 'default',
        className: 'shadow-sm shadow-black/5',
      },
      {
        variant: 'outline',
        mode: 'default',
        appearance: 'default',
        className: 'shadow-sm shadow-black/5',
      },
      {
        variant: 'primary',
        mode: 'icon',
        appearance: 'default',
        className: 'shadow-sm shadow-black/5',
      },
      {
        variant: 'outline',
        mode: 'icon',
        appearance: 'default',
        className: 'shadow-sm shadow-black/5',
      },
      {
        variant: 'primary',
        mode: 'link',
        underline: 'solid',
        className: 'hover:underline hover:underline-offset-4',
      },
      {
        variant: 'primary',
        mode: 'link',
        underlined: 'solid',
        className: 'underline underline-offset-4',
      },
      {
        variant: 'inverse',
        mode: 'link',
        underline: 'solid',
        className: 'text-inherit hover:underline hover:underline-offset-4',
      },
      {
        variant: 'foreground',
        mode: 'link',
        underline: 'solid',
        className: 'text-foreground hover:underline hover:underline-offset-4',
      },
      {
        variant: 'ghost',
        mode: 'icon',
        className: 'text-muted-foreground',
      },
      {
        size: 'sm',
        mode: 'icon',
        className: 'h-7 w-7 p-0 [&_svg]:size-3.5',
      },
      {
        size: 'md',
        mode: 'icon',
        className: 'h-9 w-9 p-0 [&_svg]:size-4',
      },
      {
        size: 'icon',
        className: 'h-9 w-9 p-0 [&_svg]:size-4',
      },
      {
        size: 'lg',
        mode: 'icon',
        className: 'h-10 w-10 p-0 [&_svg]:size-4',
      },
      {
        mode: 'input',
        placeholder: true,
        variant: 'outline',
        className: 'font-normal text-muted-foreground',
      },
    ],
    defaultVariants: {
      variant: 'primary',
      mode: 'default',
      size: 'md',
      shape: 'default',
      appearance: 'default',
    },
  },
);

function Button({
  className,
  selected,
  variant,
  shape,
  appearance,
  mode,
  size,
  autoHeight,
  underlined,
  underline,
  asChild = false,
  placeholder = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    selected?: boolean;
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({
          variant,
          size,
          shape,
          appearance,
          mode,
          autoHeight,
          placeholder,
          underlined,
          underline,
          className,
        }),
        asChild && props.disabled && 'pointer-events-none opacity-50',
      )}
      {...(selected && { 'data-state': 'open' })}
      {...props}
    />
  );
}

interface ButtonArrowProps extends React.SVGProps<SVGSVGElement> {
  icon?: LucideIcon;
}

function ButtonArrow({ icon: Icon = ChevronDown, className, ...props }: ButtonArrowProps) {
  return <Icon data-slot="button-arrow" className={cn('ms-auto -me-1', className)} {...props} />;
}

export { Button, ButtonArrow, buttonVariants };
