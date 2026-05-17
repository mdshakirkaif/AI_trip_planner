from pydantic import BaseModel,Field
from langchain_groq import ChatGroq
from utils.config_loader import load_config
from typing import Literal,Optional,Any
import os
from dotenv import load_dotenv

class ConfigLoader:
    def __init__(self):
        load_dotenv()
        print(f"Loaded config.....")
        self.config=load_config()
    
    def __getitem__(self, key):
        return self.config[key]
    
class ModelLoader(BaseModel):
    model_provider:Literal['groq','openai'] ='groq'
    config: Optional[ConfigLoader]=Field(default=None,exclude=True)
    
    def model_post_init(self, __context: Any)-> None:
        self.config=ConfigLoader()

    model_config = {
        'arbitrary_types_allowed': True,
    }

    def load_model(self):
        """
        Load and return the LLM model.
        """
        print("LLM loading...")
        print(f"Loading model from provider: {self.model_provider}")
        if self.model_provider=='groq':
            print('Loading LLm from Groq..........')
            groq_api_key=os.getenv('GROQ_API_KEY')
            model_name= self.config['llm']['groq']['model_name']
            llm=ChatGroq(model=model_name,api_key=groq_api_key)
            print('groq model loaded ')

        elif self.model_provider=='openai':
            print('Loading LLm from openai..........')
            openai_api_key=os.getenv('OPENAI_API_KEY')
            model_name= self.config['llm']['openai']['model_name']
            llm=ChatGroq(model=model_name,api_key=openai_api_key)

        return llm
