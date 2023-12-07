import pandas as pd
import csv

# Description: Modifies the column names to better describe each attribute
def columnNameCleanup(infile, outfile='column_name_cleaned_dataset.csv'):
    # Read the CSV file
    df = pd.read_csv(infile)

    df.columns = df.columns.str.replace('id', 'Unique ID', case=False)
    df.columns = df.columns.str.replace('Rating', 'Company Rating', case=False)
    df.columns = df.columns.str.replace('Location', 'Company Location', case=False)
    df.columns = df.columns.str.replace('Headquarters', 'Headquarters Location', case=False)
    df.columns = df.columns.str.replace('Founded', 'Date Founded', case=False)
    df.columns = df.columns.str.replace('Type of ownership', 'Type of Ownership', case=False)
    df.columns = df.columns.str.replace('Size', 'Number of Employees', case=False)
    df.columns = df.columns.str.replace('Revenue', 'Revenue (USD)', case=False)

    df.to_csv(outfile, index=False)

    return outfile


# Description: Converts the existing 'Salary Estimate' ranges (e.g. 30K - 60K) to an average of the upper and
#              lower bounds in dollar amount format (e.g. $45,000.00). This allows for easier comparison between
#              this attribute and others
def salaryCleanup(infile, outfile='salary_cleaned_dataset.csv'):
    # Read the CSV file
    df = pd.read_csv(infile)

    # Extract lower and upper ranges
    df[['Lower', 'Upper']] = df['Salary Estimate'].str.extract(r'\$(\d+)K-\$?(\d+)K')

    # Calculate average salary
    df['Average Salary'] = (df['Lower'].astype(float) + df['Upper'].astype(float)) / 2 * 1000

    # Format the 'Average Salary' column as a dollar amount
    df['Average Salary'] = df['Average Salary'].apply('${:,.2f}'.format)

    # Replace original column with the calculated and formatted values
    df['Salary Estimate'] = df['Average Salary']

    # Drop unnecessary columns
    df = df.drop(['Lower', 'Upper', 'Average Salary'], axis=1)

    # Save the modified DataFrame back to a CSV file
    df.to_csv(outfile, index=False)

    return outfile

# NOTE: It is yet to be determined whether this attribute will be cleaned up or not
# Description: Isolates the state from the 'Company Location' attribute in order to group similarly-located companies
def locationCleanup(infile, outfile='location_cleaned_dataset.csv'):
    # Read the CSV file
    df = pd.read_csv(infile)

    # Extract state abbreviation
    df['State'] = df['Location'].str.extract(r',\s*([A-Za-z]{2})')

    # Replace the original 'Location' column with the extracted state abbreviation
    df['Location'] = df['State']

    # Drop the 'State' column if you don't need it
    df = df.drop('State', axis=1)

    # Save the modified DataFrame back to a CSV file
    df.to_csv(outfile, index=False)

    return outfile

# NOTE: It is yet to be determined whether this attribute will be cleaned up or not
# Description: Isolates the city from the 'Headquarters Location' attribute in order to make patterns in HQ 
#              location more visible
def headquartersCleanup(infile, outfile='location_cleaned_dataset.csv'):
    # Read the CSV file
    df = pd.read_csv(infile)

    def clean_headquarters(headquarters):
        if('-1' not in headquarters):
            if('(US)' in headquarters):
                start, middle, end = headquarters.split(',')
                return f"{start}"
            else:
                start, end = headquarters.split(',')
                return f"{start}"
        else:
            return f"Unknown"
            
    # Apply the clean_size function to the 'Size' column
    df['Headquarters'] = df['Headquarters'].apply(clean_headquarters)

    # Save the modified DataFrame back to a CSV file
    df.to_csv(outfile, index=False)

    return outfile

# Description: Removes the second line from the 'Company Name' attribute that contains a redundant 
#              value for 'Company Rating'
def nameCleanup(infile, outfile='name_cleaned_dataset.csv'):
    # Read the CSV file into a DataFrame
    df = pd.read_csv(infile)

    # Extract only the first line from the 'Company Name' column
    df['Company Name'] = df['Company Name'].apply(lambda x: str(x).split('\n')[0].strip())

    # Save the modified DataFrame to a new CSV file
    df.to_csv(outfile, index=False)

    return outfile

# Description: Standardizes the formatting of the 'Number of Employees' Attribute. Actual values are not changed
def sizeCleanup(infile, outfile='size_cleaned_dataset.csv'):
    # Read the CSV file into a DataFrame
    df = pd.read_csv(infile)

    # Function to clean up the 'Size' column
    def clean_size(size):
        if ' to ' in size:  # If the value is a range
            start, end = size.split(' to ')
            first_string = "" + start + "-" + end
            start, end = first_string.split('employees')
            return_string = start.strip()
            return f"{return_string} Employees"
        elif '+' in size:  # If the value is '10000+'
            return "10000+ Employees"
        else:
            return 'Unknown'  # Return unchanged if not a recognized format
        
    # Apply the clean_size function to the 'Size' column
    df['Size'] = df['Size'].apply(clean_size)

    # Save the cleaned DataFrame to a new CSV file with quoting set to QUOTE_NONNUMERIC
    df.to_csv(outfile, index=False)

    return outfile

# Description: Standardizes the formatting of the 'Revenue' attribute. Actual values are not changed
def revenueCleanup(infile, outfile='revenue_cleaned_dataset.csv'):
    # Read the CSV file into a DataFrame
    df = pd.read_csv(infile)

    # Function to clean up the 'Size' column
    def clean_revenue(revenue):
        if ' to ' in revenue:  # If the value is a range
            if('million' in revenue and 'billion' in revenue):
                start, end = revenue.split(' (')
                return_string = start.replace(" million", ",000,000")
                return_string = return_string.replace(" billion", ",000,000,000")
                return f"{return_string}"
            elif('million' in revenue):
                start, end = revenue.split(' to ')
                first_string = "" + start + ",000,000-" + end
                start, end = first_string.split(" m")
                return_string = (start + ",000,000").strip()
                return f"{return_string}"
            elif('billion' in revenue):
                start, end = revenue.split(' to ')
                first_string = "" + start + ",000,000,000-" + end
                start, end = first_string.split(" b")
                return_string = (start + ",000,000,000").strip()
                return f"{return_string}"
        elif 'Less' in revenue:  # If the value is <1 million
            return "<$1,000,000"
        elif '+' in revenue:  # If the value is >10 billion
            return "$10,000,000,000+"
        else:
            return 'Unknown'  # Return unchanged if not a recognized format
        
    # Apply the clean_size function to the 'Size' column
    df['Revenue'] = df['Revenue'].apply(clean_revenue)

    # Save the cleaned DataFrame to a new CSV file
    df.to_csv(outfile, index=False)

    return outfile

# Description: Adds a new attribute called 'Quality Score'. The value of this is calculated by taking a weighted
#              sum of the 'Salary Estimate' and 'Company Rating' values in comparison to the min/max value of
#              each. Both of the constituent attributes can be seen as ways to measure the general desirability
#              of employment as a company, so combining the two into one referencable score will make drawing 
#              conclusions about correlations within the data easier
def computeQualityScore(infile, outfile='score_cleaned_dataset.csv'):
    # Read the CSV file into a DataFrame
    df = pd.read_csv(infile)

    def convert_salary_to_numeric(salary):
        # Remove non-numeric characters and convert to numeric
        return pd.to_numeric(salary.str.replace('[^\d]', '', regex=True), errors='coerce')

    # Convert 'Salary Estimate' values to numeric
    df['Salary Estimate Number'] = convert_salary_to_numeric(df['Salary Estimate'])

    # Extract 'Salary Estimate' and 'Rating' columns
    salary_values = df['Salary Estimate Number']
    rating_values = df['Rating']

    min_salary = salary_values.min()
    max_salary = salary_values.max()

    # Calculate salary_sum
    salary_sum = (salary_values - min_salary) / (max_salary - min_salary)

    # Calculate rating_sum, excluding -1 values
    rating_sum = (rating_values / 5)
    rating_sum[rating_values == -1] = -1  # Assign -1 to the entries with no rating

    # Calculate the score using a weighted sum
    overall_score = (0.7 * salary_sum + 0.3 * rating_sum)
    overall_score[rating_sum == -1] = salary_sum

    # Normalize to a scale of 0-10
    min_score = overall_score.min()
    max_score = overall_score.max()
    normalized_score = round(10 * (overall_score - min_score) / (max_score - min_score), 2)

    df['Quality Score'] = normalized_score

    # Drop the 'State' column if you don't need it
    df = df.drop('Salary Estimate Number', axis=1)

    df.to_csv(outfile, index=False)

    return outfile  

# Description: Replaces any value that equals -1 with 'Unknown', as that is what -1 represents in this case
def replace_negative_one(infile, outfile='negative_cleaned_dataset'):

    # Read the CSV file into a DataFrame
    df = pd.read_csv(infile)

    # Iterate through each column and replace -1 with 'Unknown / Non-Applicable'
    for col in df.columns:
        df[col] = df[col].replace(-1, 'Unknown')
        df[col] = df[col].replace('-1', 'Unknown')

    # Save the modified DataFrame back to a CSV file
    df.to_csv(outfile, index=False)


# Description: Cleans dataset and writes changes to new file 'cleaned_dataset.csv'
def cleanAll(infile):
    cleaned_dataset = 'cleaned_dataset.csv'
    cleaned_dataset = salaryCleanup(infile, cleaned_dataset)
    cleaned_dataset = locationCleanup(cleaned_dataset, cleaned_dataset)
    cleaned_dataset = headquartersCleanup(cleaned_dataset, cleaned_dataset)
    cleaned_dataset = nameCleanup(cleaned_dataset, cleaned_dataset)  
    cleaned_dataset = sizeCleanup(cleaned_dataset, cleaned_dataset)
    cleaned_dataset = revenueCleanup(cleaned_dataset, cleaned_dataset)
    cleaned_dataset = computeQualityScore(cleaned_dataset, cleaned_dataset)
    cleaned_dataset = columnNameCleanup(cleaned_dataset, cleaned_dataset)
    cleaned_dataset = replace_negative_one(cleaned_dataset, cleaned_dataset)

    return cleaned_dataset

if __name__ == "__main__":

    infile = 'dataset.csv'
    # cleanAll(infile)
    cleanAll(infile)
