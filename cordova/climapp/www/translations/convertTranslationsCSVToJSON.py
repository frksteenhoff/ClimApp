
# coding: utf-8

# # ClimApp Translations: CSV to JSON 
# ----
# This jupyter nootebook is used to convert three CSV files to one JSON objects:
# the files need to follow the below naming scheme:
# 
# #### Input
# * Toasts:    `climapp_translation_sheet_toasts.csv`
# * Wheels:    `climapp_translation_sheet_wheels.csv` 
# * Labels:    `climapp_translation_sheet_labels.csv`
# * Sentences: `climapp_translation_sheet_sentences.csv`
# * API text:  `climapp_translation_sheet_api.csv` -- NOT IMPLEMENTED YET
# * feedback:  `climapp_translation_sheet_feedback.csv` -- NOT IMPLEMENTED YET
# 
# #### Output
# * `combined_object`: `translations.json`
# 
# 
# #### Procedure
# Each file is read one by one, converted in different ways and merged into one JSON object that will be used in the ClimApp mobile application for translating the app content.
# 
# **The array `availableLanguages` contains an overview of all current languages. Update this if more languages are made available. **
# 
# ----

# ----------------------------------------------------------------
# **Importing needed libraries**
# ----------------------------------------------------------------
import pandas as pd
import json
import os
import numpy as np
from time import ctime, strftime, gmtime

os.getcwd()
troubleshoot = False


print("Today's date: " + ctime())

print("---------------------------------------------------")
print("Preparing for conversion ..")
print("Moving old translation file to archive ..")

datestr = strftime("%d%m%Y", gmtime()) 

if os.path.isfile("translations.json"):
    archivePath = "archive/translations" + datestr + ".json"
    if not os.path.isfile(archivePath):
        os.rename("translations.json", archivePath)
        print("Old translations file moved to archive.")
    print("Translations file already moved to archive")
else:
    print("No previous translation file, skipping move")
print("---------------------------------------------------")

# ----------------------------------------------------------------
# ## Functions
# ----------------------------------------------------------------

# Definitions of the two functions used for conversion
# 
# * `toast` and `text` use **convertCSVtoJSON_simple**
# * `wheels` use **convertCSVtoJSON_nested**

# Converting simple CSV structure to json
# df                 - dataframe with csv content
# availableLanguages - languages to translate
def convertCSVtoJSON_simple(df, availableLanguages):
    json = {}
    for i in range(len(df['text_id'])):
        json[df['text_id'][i]] = { lang : df[lang][i] for lang in availableLanguages}
    return json


# Converting CSV content to nested json objet
# df                 - dataframe with csv content
# availableLanguages - languages to translate
def convertCSVtoJSON_nested(df, availableLanguages):
    wheels = {}
    # Add all unique text_id keys
    for val in df['text_id'].unique():
        wheels[val] = {}

    # For all nested keys for each text_id if not exist, add
    for i in range(len(df['key2'])):

        if(df['key2'][i] not in wheels[df['text_id'][i]]):        
            # Add translations for all available languages
            wheels[df['text_id'][i]].update({df['key2'][i] : {}})

        if(pd.isnull(df['key3'][i])):
            # If key3 is null, add translations directly
            wheels[df['text_id'][i]][df['key2'][i]].update({lang : df[lang][i] for lang in availableLanguages})
        else:
            # If key3 has a value, add languages as childs of the key3 value
            wheels[df['text_id'][i]][df['key2'][i]].update({df['key3'][i] : {lang : df[lang][i] for lang in availableLanguages}})
    return wheels

# ----------------------------------------------------------------
# ## Labels
# ----------------------------------------------------------------

# #### Reading in file with general strings

df = pd.read_csv("climapp_translation_sheet - labels.csv")
df.head()


# #### **Available languages**
# NOTE: This information is used in all conversions, translations MUST be completed in the same languages for `text`, `toasts` and `wheels` for the program to work correctly.
# 
# * all columns but the first contains languages, we only include those that have values for all keys.
# * If there are ANY null values within the translations, the language will be escluded. 
# * It is important only to include rows with values!
# 
# 


# Extracting available languages from the labels sheet

availableLanguages = []

print("All languages declared in sheet: ", df.columns[1:].values, "\n")

for lang in df.columns[1:]:
    if(not pd.isnull(df[lang]).any()):
        print("'" + lang + "' translations are added correctly")
        availableLanguages.append(lang)
    else:
        print("'" + lang + "' translations are MISSING VALUES")

print("---------------------------------------------------")
print("Currently available languages: ", availableLanguages)
print("---------------------------------------------------")

# #### Converting csv content to JSON object

print("Converting labels.. ")
labels = convertCSVtoJSON_simple(df, availableLanguages)
if(troubleshoot):
    print(json.dumps(labels, indent=4))

# ----------------------------------------------------------------
# ## Sentences
# ----------------------------------------------------------------

# #### Reading in file with toast text

print("Converting sentences.. ")
df = pd.read_csv("climapp_translation_sheet - sentences.csv")

# **Showing basic content**
df.head()


# #### Converting csv content to JSON object
sentences = convertCSVtoJSON_simple(df, availableLanguages)
if(troubleshoot):
    print(json.dumps(sentences, indent=4))

# ----------------------------------------------------------------
# ## Toasts
# ----------------------------------------------------------------

# #### Reading in file with toast text

print("Converting toasts.. ")
df = pd.read_csv("climapp_translation_sheet - toasts.csv")

# **Showing basic content**
df.head()


# #### Converting csv content to JSON object
toasts = convertCSVtoJSON_simple(df, availableLanguages)
if(troubleshoot):
    print(json.dumps(toasts, indent=4))

# ----------------------------------------------------------------
# ## Wheels
# ----------------------------------------------------------------

# #### Reading in file with wheels text

print("Converting wheels (partial content).. ")
df = pd.read_csv("climapp_translation_sheet - wheels.csv")
df.head()


# #### Converting csv content to JSON object
wheels = convertCSVtoJSON_nested(df, availableLanguages)
# Use to check the result
if(troubleshoot):
    print(json.dumps(wheels, indent=4))


# ----------------------------------------------------------------
# ## API
# ----------------------------------------------------------------

# #### Reading in file with toast text

#print("Converting API text (not used in app).. ")
#df = pd.read_csv("climapp_translation_sheet - api.csv")

# **Showing basic content**
#df.head()


# #### Converting csv content to JSON object
#api = convertCSVtoJSON_simple(df, availableLanguages)
#if(troubleshoot):
#    print(json.dumps(api, indent=4))


# ----------------------------------------------------------------
# COMBINE 
# ----------------------------------------------------------------

# ## Combining all information in one JSON object
print("Combining all json objects.. ")
combined_object = {"labels" : labels, "sentences" : sentences, "wheels" : wheels, "toasts" : toasts}
if(troubleshoot):
    print(json.dumps(combined_object, indent=4))


# ### Saving the above struture to a .JSON file

print("Saving object to file as 'translations.json'.. ")
with open('translations.json', 'w') as f:
    json.dump(combined_object, f)
    print("Conversion completed!")
    print("---------------------------------------------------")
    print("Remember to update the available languages in index.js, function: getLanguage, for the changes to take effect")
    print("---------------------------------------------------")