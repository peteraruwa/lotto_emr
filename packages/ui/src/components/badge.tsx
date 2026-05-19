import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        // Standard shadcn/ui variants
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground',

        // Clinical status variants
        /** Abnormal / critically out-of-range value — red background */
        critical:
          'border-transparent bg-red-600 text-white shadow font-bold animate-pulse',
        /** Value within normal reference range */
        stable:
          'border-transparent bg-green-100 text-green-800 border-green-200',
        /** Result received but not yet reviewed */
        pending:
          'border-transparent bg-amber-100 text-amber-800 border-amber-200',
        /** Order or encounter is active */
        active:
          'border-transparent bg-blue-100 text-blue-800 border-blue-200',
        /** Order or encounter is completed */
        completed:
          'border-transparent bg-gray-100 text-gray-700 border-gray-200',
        /** Order or encounter was cancelled */
        cancelled:
          'border-transparent bg-gray-100 text-gray-500 border-gray-200 line-through',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge component with clinical status variants.
 *
 * @example
 * <Badge variant="critical">CRITICAL</Badge>
 * <Badge variant="stable">Normal</Badge>
 * <Badge variant="pending">Pending</Badge>
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
