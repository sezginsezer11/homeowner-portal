# Homeowner "Sell Your Home" Workflow

Complete selling strategy tool with 3 sale options, property confirmation, and dynamic remodeling cost calculator.

## Files Included

### 1. **Entry Page** → `/app/dashboard/homeowner/sell-property/page.js`
- Lets homeowners choose: Use current property or enter a new address
- Passes address via sessionStorage to the main workflow

### 2. **Main Workflow** → `/app/dashboard/homeowner/sell-home/page.js`
The complete 4-step process:

**Step 1: Option Select**
- Standard Sale
- Remodel & Sell  
- Sell for Cash

**Step 2: Confirm Property**
- Address, Sq Ft, Lot Size, Beds, Baths, Year Built, Type, Condition

**Step 3: Remodeling Options** (only for Remodel & Sell)
- Kitchen (fixed: $30K-$60K)
- Full Bathrooms (fixed: $13K-$30K per bath, with quantity selector)
- Half Bathrooms (fixed: $3K-$10K per bath, with quantity selector)
- Flooring (dynamic: $10-$20/sqft based on home sqft)
- Backyard (dynamic: $5-$15/sqft based on lot size)
- Interior Paint (dynamic: $4-$8/sqft based on home sqft)
- Exterior Paint (dynamic: $4-$8/sqft based on home sqft)

**Step 4: Summary**
- Property recap
- Remodeling costs breakdown (if applicable)
- Next steps + CTA to contact agent

### 3. **Property Card Component** → `/components/HomeownerPropertyCard.js`
Display on homeowner dashboard showing:
- Estimated Value
- Equity
- Loan Balance
- Total Gain & Appreciation %
- "Sell Home" button (pre-fills address)
- "Invest More" button (optional)

## Installation

1. Download `homeowner-sell-workflow.zip`
2. Extract files to their respective locations:
   - `app/dashboard/homeowner/sell-home/page.js` → create folder
   - `app/dashboard/homeowner/sell-property/page.js` → create folder
   - `components/HomeownerPropertyCard.js` → existing folder

3. Update homeowner dashboard to include the property card:

```jsx
// In your homeowner dashboard page
import HomeownerPropertyCard from '@/components/HomeownerPropertyCard'

export default function HomeownerDashboard() {
  return (
    <div className="space-y-6">
      <HomeownerPropertyCard />
      {/* Rest of dashboard */}
    </div>
  )
}
```

## How It Works

### Navigation Flow
1. Homeowner clicks **"Sell Home"** button on dashboard (via property card)
   - OR goes to `/dashboard/homeowner/sell-property`
2. Chooses to use current property or enter new address
3. Selects one of 3 sale options
4. Confirms property details (address, sqft, lot size, beds, baths, etc.)
5. If "Remodel & Sell": Selects remodeling upgrades
   - Costs calculated dynamically based on sqft/lot size
   - Can adjust quantities for bathrooms
6. Reviews summary with total costs
7. Clicks "Contact Sez Sezer to Get Started"

### Dynamic Pricing Calculations

**Fixed Costs:**
- Kitchen: $30K, $45K, $60K
- Full Bathroom: $13K, $20K, $30K (per bath)
- Half Bathroom: $3K, $5K, $10K (per bath)

**Sqft-Based (Home Size):**
- Flooring: $10, $14, $20 per sqft
- Interior Paint: $4, $6, $8 per sqft
- Exterior Paint: $4, $6, $8 per sqft

**Lot Size-Based:**
- Backyard: $5, $10, $15 per sqft of lot

### Data Passing
Uses `sessionStorage` to pass the address:
```js
sessionStorage.setItem('sell_home_address', address)
```

## Customization

**Change sample property (in HomeownerPropertyCard.js):**
```js
const prop = property || {
  address: '4503 Sun Valley Road',  // ← Change this
  city: 'Del Mar, CA 92014',        // ← Change this
  estValue: 4966379,
  // ... rest
}
```

**Adjust remodeling prices:**
Edit the costs in the `getRemodelCost()` function in `sell-home/page.js`:
```js
const costs = {
  kitchen: { a: 30000, b: 45000, c: 60000 },  // ← Adjust here
  // ... etc
}
```

**Change button text/CTAs:**
Search for "Contact Sez Sezer" in both pages and update as needed.

## Features

✅ 3 sale options (Standard, Remodel, Cash)
✅ Dynamic cost calculator for sqft/lot-based upgrades
✅ Quantity selector for bathrooms
✅ Summary with full breakdown
✅ Mobile responsive
✅ Address carries through entire workflow
✅ Can go back/edit at any step
✅ Beautiful UI matching 360Everywhere aesthetic

## Next Integration

Consider adding:
- Integration with MLS data for market values
- Lead capture → send to CRM
- Email confirmation with selling strategy PDF
- Chat with agent before contacting
- View comparable sales for market analysis

---

For questions or customizations, contact the development team.
