from utils.model_loader import ModelLoader
from prompt_library.prompt import SYSTEM_PROMPT
from langgraph.graph import StateGraph,START,END,MessagesState
from langgraph.prebuilt import ToolNode, tools_condition
from tools.weather_info_tool import WeatherInfoTool
from tools.place_search_tool import PlaceSearchTool
from tools.expense_calculator_tool import CalculatorTool
from tools.currency_conversion_tool import CurrencyConverterTool


class GraphBuilder():
    def __init__(self,model_provider:str ='groq'):
        self.model_loader=ModelLoader(model_provider=model_provider)
        self.llm=self.model_loader.load_model()
        
        self.tools=[]
        
        self.weather_tools=WeatherInfoTool()
        self.place_search_tools=PlaceSearchTool()
        self.currency_converter_tools=CurrencyConverterTool()
        self.calculator_tools=CalculatorTool()
        
        self.tools.extend([* self.weather_tools.weather_tool_list, 
                           * self.place_search_tools.place_search_tool_list,
                           * self.calculator_tools.calculator_tool_list,
                           * self.currency_converter_tools.currency_converter_tool_list])
        
        self.llm_with_tools=self.llm.bind_tools(tools=self.tools)
        self.graph=None
        self.system_prompt= SYSTEM_PROMPT
        
    def agent_function(self, state:MessagesState):
        """Main agent function"""
        user_question=state['messages']
        input_questions=[self.system_prompt]+ user_question
        responce= self.llm_with_tools.invoke(input_questions)
        return {'messages':[responce]}
    
    def build_graph(self):
        graph_build=StateGraph(MessagesState)
        graph_build.add_node('agent',self.agent_function)
        graph_build.add_node('tools',ToolNode(tools=self.tools))
        graph_build.add_edge(START,'agent')
        graph_build.add_conditional_edges('agent',tools_condition)
        graph_build.add_edge('tools','agent')
        graph_build.add_edge('agent',END)
        self.graph=graph_build.compile()
        return self.graph
    
    def __call__(self):
        return self.build_graph
