import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export function PlanPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        'Up to 3 auctions',
        'Up to 50 items per auction',
        'Basic item descriptions',
        'Manual comp research'
      ],
      current: true,
      cta: 'Current Plan'
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'per month',
      description: 'For professional auctioneers',
      features: [
        'Unlimited auctions',
        'Unlimited items',
        'AI-powered descriptions',
        'Automatic comp finding',
        'Priority support',
        'Export to CSV/PDF'
      ],
      current: false,
      cta: 'Upgrade to Pro',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: 'per month',
      description: 'For large auction houses',
      features: [
        'Everything in Pro',
        'Multiple team members',
        'Custom branding',
        'API access',
        'Dedicated support',
        'Custom integrations'
      ],
      current: false,
      cta: 'Contact Sales'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-muted-foreground">
          Select the plan that best fits your auction needs
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.name} 
            className={plan.popular ? 'border-primary shadow-lg' : ''}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
                {plan.popular && (
                  <Badge variant="default">Popular</Badge>
                )}
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm ml-2">
                  {plan.period}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.current ? 'outline' : 'default'}
                disabled={plan.current}
              >
                {plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Info */}
      <div className="bg-muted rounded-lg p-6">
        <h3 className="font-semibold mb-2">Need help choosing?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Not sure which plan is right for you? Contact our sales team for a personalized recommendation.
        </p>
        <Button variant="outline">Contact Sales</Button>
      </div>
    </div>
  );
}
