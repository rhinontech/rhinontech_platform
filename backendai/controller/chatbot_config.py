
import PIL.Image
from pptx import Presentation
import requests
from io import BytesIO
import PyPDF2
from services.gemini_services import chat_gemini
import docx
import requests
from bs4 import BeautifulSoup

def get_url_data(url):
    try:
        # Fetch data from the URL
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        paragraphs = soup.find_all('p')
        url_data = "\n".join([p.get_text() for p in paragraphs])

        # Return success response
        return url_data

    except requests.exceptions.RequestException as e:
        return ""


# Fetch the image from the URL
def image_data(url):
    response_image = requests.get(url)
    if response_image.status_code == 200:
        img = PIL.Image.open(BytesIO(response_image.content))
        request = "Please write a brief summary of this image."
        response = chat_gemini(request, img)
        
        for chunk in response:
            return chunk.text
    else:
        print("Failed to retrieve the image. Status code:", response_image.status_code)

def pdf_data(pdf_url):
    response = requests.get(pdf_url)
    response.raise_for_status()
    
    if response.status_code == 200:
        file = BytesIO(response.content)
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page_num in range(len(reader.pages)):
            page = reader.pages[page_num]
            text += page.extract_text()
        request_summary = text + "\n\n\nPlease write a brief report data of the above report.\n\n"
        
        response = chat_gemini(request_summary)
        for chunk in response:
            print(chunk.text)
            return chunk.text
        
        
def doc_data(docx_url):
    response = requests.get(docx_url)
    response.raise_for_status()
    
    if response.status_code == 200:
        file = BytesIO(response.content)
        doc = docx.Document(file)
        text = "\n".join([para.text for para in doc.paragraphs])
        
        request_summary = text + "\n\n\nPlease write a brief report data of the above report.\n\n"

        response = chat_gemini(request_summary)
        for chunk in response:
            print(chunk.text)
            return chunk.text
        
def txt_data(txt_url):
    response = requests.get(txt_url)
    response.raise_for_status()
    
    if response.status_code == 200:
        text = response.text
        
        request_summary = text + "\n\n\nPlease write a brief report data of the above report.\n\n"

        response = chat_gemini(request_summary)
        for chunk in response:
            print(chunk.text)
            return chunk.text

def ppt_data(pptx_url):
    response = requests.get(pptx_url)
    response.raise_for_status()

    if response.status_code == 200:
        file = BytesIO(response.content)
        presentation = Presentation(file)
        text = ""

        for slide in presentation.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text += shape.text + "\n"

        request_summary = text + "\n\n\nPlease write a brief report data of the above report.\n\n"

        response = chat_gemini(request_summary)
        for chunk in response:
            print(chunk.text)
            return chunk.text