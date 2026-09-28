# Insight Weaver

Build a complete web application called:

AI-Powered Customer Behavior Analytics and Business Insight System

CORE PURPOSE

This project is NOT primarily an ERP, inventory-management, supplier-management, or CRUD application.

The main purpose of this project is to take historical customer and sales data, analyze it using data analytics and machine learning, identify important patterns and problems in the business, and generate a clear AI-powered business feedback and recommendation report.

The system should behave like a business analytics assistant.

The user uploads or provides sales/customer data, and the system should automatically analyze it and answer:

What is happening in the business?

What products/categories are performing well?

What products/categories are performing poorly?

Where are sales lagging?

When do customers buy the most?

Which seasons/months/days have the highest sales?

Which customer age groups purchase the most?

Which customer segments are most valuable?

Which locations perform better or worse?

What customer behavior patterns exist?

What are the major business problems?

What areas need improvement?

What should the business do to improve?

What opportunities should the business take advantage of?

Give a final easy-to-understand business feedback summary.

The most important output of the application should be the Business Feedback / AI Insights Report, not just charts.

1. SIMPLE ARCHITECTURE

Use a simple architecture:

Sales / Customer Dataset
↓
Data Upload
↓
FastAPI Backend
↓
Pandas + NumPy
↓
Data Cleaning & Analysis
↓
Machine Learning / Statistical Analysis
↓
Pattern Detection
↓
Business Insight Engine
↓
AI Feedback & Recommendations
↓
React Dashboard

Do NOT create unnecessary complex backend modules.

Do NOT build a large ERP system.

Do NOT create unnecessary supplier, warehouse, inventory, or complicated order-management modules unless they are required by the dataset.

Focus the entire project on:

Customer Behavior + Sales Analysis + Business Problems + Recommendations

2. DATA INPUT

The application should support uploading:

CSV

Excel

The dataset may contain fields such as:

Customer ID

Customer Age

Gender

Location

Product

Product Category

Quantity

Price

Sales Amount

Order Date

Order Time

Season

Payment Method

Discount

Rating

The system must not depend on every column being present.

It should automatically detect available columns and analyze the columns that exist.

If a required analysis cannot be performed because the dataset does not contain the required information, show:

"Insufficient data available for this analysis."

Do not fabricate results.

3. DATA PROCESSING

When a dataset is uploaded:

Read the dataset.

Detect columns.

Identify missing values.

Remove or handle duplicates.

Handle missing values appropriately.

Convert dates and times into useful formats.

Calculate derived variables where possible.

Validate numerical columns.

Prepare the cleaned dataset for analysis.

Show a small data-quality summary:

Number of rows

Number of columns

Missing values

Duplicate records

Date range

Total sales

Number of customers

Number of products

4. SALES PERFORMANCE ANALYSIS

Analyze overall sales performance.

Calculate:

Total revenue

Total orders/transactions

Total quantity sold

Average transaction value

Average sales per customer

Sales growth/decline

Best-performing product

Worst-performing product

Best-performing category

Worst-performing category

Identify:

Growing sales

Declining sales

Stable sales

Sudden changes

Underperforming areas

5. SALES LAGGING ANALYSIS

This is a CORE feature.

The system must identify where sales are lagging.

Analyze:

Products

Categories

Locations

Time periods

Customer groups

Seasons

Identify products/categories whose sales are:

Declining

Consistently low

Below average

Losing customers

Showing unusual drops

For each detected problem, generate an explanation.

Example:

"Electronics sales declined by 18% compared with the previous period."

Then provide:

Problem

Electronics sales are declining.

Possible reason

The decline is concentrated among customers aged 25–35 and is strongest during weekdays.

Recommended action

Consider targeted weekday promotions for this customer group.

Do not make unsupported causal claims. Clearly distinguish between observed patterns and possible explanations.

6. CUSTOMER BEHAVIOR ANALYSIS

Analyze customer purchasing behavior.

Study:

Customer age

Gender

Location

Purchase frequency

Average spending

Number of purchases

Product preferences

Category preferences

Repeat purchases

Purchase timing

Answer questions such as:

Which age group buys the most?

Which age group generates the most revenue?

Which gender contributes the most sales?

Which location has the highest sales?

Which location is underperforming?

Which customers purchase repeatedly?

Which customers have low engagement?

Which products are preferred by different customer groups?

7. AGE-WISE ANALYSIS

Group customers into meaningful age ranges, for example:

Under 18

18–24

25–34

35–44

45–54

55+

Analyze:

Number of customers

Number of purchases

Revenue

Average order value

Preferred products

Preferred categories

Generate insights such as:

"Customers aged 25–34 generate the highest revenue."

"Customers aged 45–54 have fewer purchases but a higher average transaction value."

Only generate such statements when supported by the actual data.

8. TIME-BASED CUSTOMER BEHAVIOR

Analyze when customers purchase.

Analyze:

Hour

Morning

Afternoon

Evening

Night

Day

Monday

Tuesday

Wednesday

Thursday

Friday

Saturday

Sunday

Month

January

February

etc.

Season

Where season/month information is available, analyze:

Summer

Winter

Spring

Autumn

Festival/holiday periods if represented in the dataset

Identify:

Peak purchasing time

Lowest purchasing time

Peak day

Lowest day

Peak month

Lowest month

Peak season

Weakest season

Example:

"Customer purchases are highest between 6 PM and 9 PM."

"Weekend sales are significantly higher than weekday sales."

"December is the strongest sales month."

9. SEASONAL ANALYSIS

The system must identify seasonal business patterns.

Determine:

Which season performs best?

Which season performs worst?

Which products perform best in each season?

Which customer groups purchase more during specific seasons?

How much revenue is generated in each season?

Are there recurring seasonal patterns?

Generate business feedback.

Example:

"Summer generates the highest revenue, mainly due to increased demand for Category X."

Recommendation:

"Increase promotional activity and stock availability for Category X before the summer period."

10. PRODUCT ANALYSIS

For every product/category where enough data exists, analyze:

Sales

Quantity

Revenue

Growth

Decline

Customer preference

Seasonal demand

Classify products as:

High Performer

Growing

Stable

Underperforming

Declining

Show the classification visually.

11. LOCATION ANALYSIS

If location data exists, analyze:

Revenue by location

Customers by location

Orders by location

Average spending

Product preferences

Identify:

Best-performing locations

Weak-performing locations

Growth opportunities

Example:

"Location A generates 32% of total revenue and is the strongest market."

"Location B has a large customer base but comparatively low spending."

Recommendation:

"Investigate customer preferences and promotional effectiveness in Location B."

12. CUSTOMER SEGMENTATION

Use machine learning where appropriate.

Use RFM analysis:

Recency

Frequency

Monetary value

Use K-Means clustering or another suitable clustering algorithm.

Create customer segments such as:

High Value

Loyal

Potential Loyal

New

At Risk

Low Value

For every segment show:

Number of customers

Revenue

Average spending

Purchase frequency

Recommended business action

Example:

High Value Customers

Recommendation:
"Provide loyalty benefits and personalized offers to retain these customers."

At Risk Customers

Recommendation:
"Use targeted re-engagement campaigns."

13. PATTERN DETECTION

This is one of the most important parts of the system.

Automatically detect patterns such as:

Sales increasing

Sales decreasing

Product demand changes

Customer preference changes

Seasonal patterns

Time-of-day patterns

Age-group patterns

Location patterns

Repeat-purchase patterns

Unusual sales drops

Unusual sales increases

Do not just display the numerical result.

Convert detected patterns into understandable business statements.

14. BUSINESS PROBLEM DETECTION

Create a dedicated section:

"What is going wrong?"

The system should automatically identify the biggest issues in the available data.

Examples:

Declining product sales

Low-performing categories

Weak customer segments

Poor-performing locations

Reduced repeat purchases

Seasonal decline

Low sales during specific periods

Customer engagement decline

Rank the problems by importance.

Example:

Priority 1 — Declining Product Sales

Sales for Product X have declined significantly.

Priority 2 — Weak Customer Segment

Customers aged 45–54 have low purchase frequency.

Priority 3 — Low Weekend Conversion

Weekend traffic is high but average spending is low.

15. BUSINESS IMPROVEMENT AREAS

Create a section:

"Where should the business improve?"

The system should identify specific areas such as:

Product strategy

Marketing

Customer retention

Pricing

Promotions

Seasonal campaigns

Target customer groups

Location expansion

Product positioning

Sales timing

For each area provide:

Current Situation

What the data shows.

Problem

Why it matters.

Suggested Improvement

What the business can do.

Expected Goal

What the business should try to improve.

16. AI BUSINESS FEEDBACK

This is the MOST IMPORTANT feature.

Create a page/card called:

AI Business Feedback

Generate a natural-language business summary from the analyzed data.

The summary should contain:

Overall Performance

Explain whether the business is:

Growing

Declining

Stable

Mixed

What Is Going Well

List the strongest areas.

What Is Lagging

List the weakest areas.

Customer Behavior

Explain major customer purchasing patterns.

Best Time to Sell

Explain the strongest purchasing periods.

Best Season

Explain which season performs best.

Best Customer Group

Explain which age/group/segment contributes most.

Major Business Problems

List the most important problems.

Recommended Actions

Give practical recommendations.

Business Opportunity

Identify potential growth opportunities.

17. FEEDBACK FORMAT

Do not make the feedback just one huge paragraph.

Use a structured report:

📊 Overall Business Status

Short summary.

✅ What Is Performing Well

Point 1

Point 2

Point 3

⚠️ What Is Lagging

Point 1

Point 2

Point 3

👥 Customer Behavior

Short analysis.

⏰ Peak Buying Time

Short analysis.

📅 Seasonal Performance

Short analysis.

🎯 Customer Groups

Short analysis.

🚨 Major Problems

Ranked list.

💡 Recommended Actions

Specific recommendations.

🚀 Growth Opportunities

Potential opportunities.

📝 Final Business Summary

A concise management-level summary.

18. RECOMMENDATION ENGINE

Recommendations must be based on detected data patterns.

Examples:

If product sales decline:

"Review pricing, promotion, and customer demand for this product."

If a specific age group purchases frequently:

"Create targeted campaigns for this age group."

If evening purchases are high:

"Prioritize promotional campaigns during peak evening hours."

If a season performs strongly:

"Prepare inventory and marketing campaigns before the high-demand season."

If a location underperforms:

"Analyze local customer preferences and improve targeted marketing."

If repeat purchases decline:

"Introduce customer retention or loyalty strategies."

Do not claim that a recommendation will definitely increase revenue.

Use wording such as:

"Consider", "Recommended", "Potential opportunity", and "The data suggests."

19. DASHBOARD

Create a simple professional dashboard.

Top KPI cards:

Total Revenue

Total Customers

Total Transactions

Average Order Value

Best Product

Best Season

Charts:

Sales Trend

Sales by Product

Sales by Category

Sales by Age Group

Sales by Gender

Sales by Location

Sales by Time of Day

Sales by Month

Sales by Season

Customer Segments

Then prominently display:

AI Business Feedback

with the generated insights.

20. DATA EXPLORER

Create a simple page where users can:

Upload CSV

Upload Excel

Preview data

See detected columns

See data quality

Start analysis

Button:

Analyze Data

After clicking it, process the dataset and update the dashboard.

21. BACKEND

Use:

Python
FastAPI
Pandas
NumPy
Scikit-learn

Use Prophet only if time-series forecasting is appropriate and sufficient historical data exists.

Keep backend simple.

Suggested structure:

backend/
main.py
data/
services/
data_processing.py
sales_analysis.py
customer_analysis.py
seasonal_analysis.py
pattern_detection.py
business_insights.py
recommendations.py
ml/
customer_segmentation.py
forecasting.py
models/
schemas/

Do not create unnecessary CRUD endpoints.

22. API ENDPOINTS

Create only useful APIs.

POST /api/data/upload

POST /api/analyze

GET /api/analytics/overview

GET /api/analytics/sales

GET /api/analytics/customers

GET /api/analytics/products

GET /api/analytics/time-patterns

GET /api/analytics/seasonal

GET /api/analytics/locations

GET /api/analytics/segments

GET /api/insights

GET /api/recommendations

GET /api/report

23. DATABASE

Keep database design simple.

If using MySQL, use only the tables actually required.

Possible structure:

datasets
customers
products
sales
analysis_results
business_insights

However, the system should also support direct dataset analysis without requiring users to manually enter every customer, product, or sales record through forms.

The uploaded dataset is the primary source of truth.

24. NO UNNECESSARY FORMS

IMPORTANT:

Do NOT build a large collection of forms for:

Adding suppliers

Adding inventory

Adding warehouses

Creating complicated orders

Managing procurement

Managing logistics

unless explicitly required by the supplied project requirements.

This project is an analytics and decision-support system, not an ERP.

The user should primarily:

Upload data.

Analyze data.

View patterns.

View problems.

View business feedback.

View recommendations.

25. REPORT GENERATION

Allow the user to generate a final business report.

The report should contain:

Executive Summary

Sales Performance

Customer Behavior

Product Performance

Time Analysis

Seasonal Analysis

Location Analysis

Customer Segmentation

Problems Detected

Improvement Areas

Recommendations

Growth Opportunities

Final Conclusion

Provide:

Download Report

The report should be readable by a business manager who does not have technical knowledge.

26. IMPORTANT RULE FOR AI INSIGHTS

Never invent information.

Every insight must be based on the uploaded dataset.

If data does not contain age:

Do not generate age-based conclusions.

If data does not contain time:

Do not generate time-based conclusions.

If data does not contain location:

Do not generate location-based conclusions.

Clearly show:

"Not enough data available for this analysis."

27. FINAL USER EXPERIENCE

The complete user journey should be:

Open application.

Upload sales/customer dataset.

System validates the dataset.

System cleans and processes the data.

User clicks "Analyze Data".

System performs analytics.

System detects customer behavior patterns.

System detects sales performance and lagging areas.

System identifies seasonal/time-based trends.

System identifies major business problems.

System identifies areas for improvement.

System generates recommendations.

Dashboard displays charts and KPIs.

AI Business Feedback displays a human-readable summary.

User can generate/download the final business report.

The central output must be:

DATA → PATTERNS → PROBLEMS → BUSINESS FEEDBACK → RECOMMENDATIONS

Build the application around this flow.

Do not overcomplicate the application with unnecessary backend forms or enterprise modules.

Make the UI professional, simple, clean, and suitable for an academic/project demonstration as well as a real business analytics use case.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://customerbehaviouranalytics.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7980803c-3539-489e-af80-04d7160a1605).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
