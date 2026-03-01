from pypdf import PdfReader
from PIL import Image
import pytesseract
import os
import fitz  # PyMuPDF
from app.utils.logger import get_logger

logger = get_logger(__name__)

class DocumentProcessor:
    def __init__(self):
        pass
    
    def process_file(self, file_path: str, file_type: str) -> str:
        """Process different file types and extract text"""
        try:
            if file_type == 'application/pdf' or file_path.endswith('.pdf'):
                return self._process_pdf(file_path)
            elif file_type.startswith('image/') or file_path.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
                return self._process_image(file_path)
            else:
                # Plain text file
                return self._process_text(file_path)
        except Exception as e:
            logger.error(f"Error processing file {file_path}: {e}")
            raise
    
    def _process_text(self, file_path: str) -> str:
        """Process plain text file"""
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    
    def _process_pdf(self, file_path: str) -> str:
        """Extract text from PDF, use OCR if needed"""
        text = ""
        try:
            logger.info(f"Opening PDF: {file_path}")
            reader = PdfReader(file_path)
            logger.info(f"PDF has {len(reader.pages)} pages")
            
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
                logger.info(f"Page {i+1}: extracted {len(page_text)} characters")
            
            # If no text found, try OCR
            if not text.strip():
                logger.warning(f"No text extracted, trying OCR on PDF {file_path}")
                text = self._ocr_pdf(file_path)
            
            if not text.strip():
                logger.warning(f"No text extracted from PDF {file_path}")
                return "PDF appears to be empty or unreadable."
            
            logger.info(f"Total text extracted: {len(text)} characters")
            return text
        except Exception as e:
            logger.error(f"Error processing PDF: {e}")
            raise
    
    def _ocr_pdf(self, file_path: str) -> str:
        """Extract text from PDF using OCR"""
        text = ""
        try:
            doc = fitz.open(file_path)
            for page_num in range(len(doc)):
                page = doc[page_num]
                pix = page.get_pixmap()
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                page_text = pytesseract.image_to_string(img)
                text += page_text + "\n"
                logger.info(f"OCR Page {page_num+1}: extracted {len(page_text)} characters")
            doc.close()
            return text
        except Exception as e:
            logger.error(f"Error in OCR PDF: {e}")
            return ""
    
    def _process_image(self, file_path: str) -> str:
        """Extract text from image using OCR"""
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            return text
        except Exception as e:
            logger.error(f"Error processing image with OCR: {e}")
            # If pytesseract is not installed, return error message
            return f"Image file uploaded but OCR not available. Install Tesseract-OCR to extract text from images."

document_processor = DocumentProcessor()
