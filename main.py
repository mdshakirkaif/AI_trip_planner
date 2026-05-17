from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from agent.agentic_workflow import GraphBuilder
from utils.save_to_document import save_document
from starlette.responses import JSONResponse, StreamingResponse
import os
import datetime
import json
from dotenv import load_dotenv
from pydantic import BaseModel
load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # set specific origins in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuearyRequest(BaseModel):
    question:str

@app.post('/query')
async def queary_travel_agent(query:QuearyRequest):
    try:
        print(query)
        graph =GraphBuilder(model_provider='groq')
        react_app=graph.build_graph()
        print(f"react_app type: {type(react_app)}")
        print(f"react_app: {react_app}")
        
        # png_graph = react_app.get_graph().draw_mermaid_png()
        # with open("my_graph.png", "wb") as f:
        #     f.write(png_graph)

        # print(f"Graph saved as 'my_graph.png' in {os.getcwd()}")
        # Assuming request is a pydantic object like: {"question": "your text"}
        messages={"messages":[query.question]}
        
        output=react_app.invoke(messages)
        
        # If result is dict with messages:
        if isinstance(output, dict) and "messages" in output:
            final_output = output["messages"][-1].content  # Last AI response
        else:
            final_output = str(output)
        
        return {"answer": final_output}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post('/stream')
async def stream_travel_agent(query: QuearyRequest):
    """Streaming endpoint that sends responses as Server-Sent Events (SSE)"""
    async def event_generator():
        try:
            print(f"Streaming query: {query.question}")
            graph = GraphBuilder(model_provider='groq')
            react_app = graph.build_graph()
            
            messages = {"messages": [query.question]}
            
            # Invoke the graph
            output = react_app.invoke(messages)
            
            # Extract the final output
            if isinstance(output, dict) and "messages" in output:
                final_output = output["messages"][-1].content
            else:
                final_output = str(output)
            
            # Stream the response character by character with a small delay for effect
            chunk_size = 10  # Characters per chunk
            for i in range(0, len(final_output), chunk_size):
                chunk = final_output[i:i + chunk_size]
                data = {"content": chunk}
                yield f"data: {json.dumps(data)}\n\n"
                
        except Exception as e:
            error_data = {"error": str(e), "content": f"Error: {str(e)}"}
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get('/')
async def root():
    """Serve index.html from public folder"""
    index_path = os.path.join(os.path.dirname(__file__), "public", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "index.html not found"}

@app.get('/{path:path}')
async def serve_static(path: str):
    """Serve static files (CSS, JS, etc.)"""
    file_path = os.path.join(os.path.dirname(__file__), "public", path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    # If file not found, try serving index.html for client-side routing
    index_path = os.path.join(os.path.dirname(__file__), "public", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse(status_code=404, content={"error": "File not found"})