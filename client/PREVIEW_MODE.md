# Preview Mode - View Dashboards Without Login

## How to View Dashboards Without Signing In

### Customer Dashboard Preview
To view the customer dashboard without logging in, add `?preview=true` to the URL:

```
http://localhost:3000/customer-dashboard.html?preview=true
```

### Admin Dashboard Preview
To view the admin dashboard without logging in, add `?preview=true` to the URL:

```
http://localhost:3000/admin.html?preview=true
```

## What You'll See

### Customer Dashboard Preview
- Demo customer name: "Demo Customer"
- Sample statistics (Total Bookings: 5, Active Bookings: 2, Total Spent: $1,250)
- Sample recent bookings (2 demo bookings)
- All dashboard features visible

### Admin Dashboard Preview
- Demo admin name: "Demo Admin"
- Sample statistics:
  - Total Cars: 25
  - Total Users: 150
  - Total Bookings: 89
  - Active Rentals: 12
  - Total Revenue: $45,000
- Sample analytics data
- All admin features visible

## Important Notes

⚠️ **This is for preview only!**

- Preview mode shows **demo/mock data**, not real data
- API calls will fail in preview mode (that's expected)
- A warning banner will appear at the top indicating preview mode
- This is temporary - remove `?preview=true` to restore normal authentication

## To Remove Preview Mode

Simply remove `?preview=true` from the URL, and the pages will require authentication again.

## For Production

Before deploying to production, you should:
1. Remove or disable the preview mode feature
2. Ensure all authentication checks are active
3. Test that pages properly redirect to login when not authenticated





