from utils.expence_calculator import Calculator
from typing import List
from langchain.tools import tool

class CalculatorTool:
    def __init__(self):
        self.calculator = Calculator()
        self.calculator_tool_list = self._setup_tools()

    def _setup_tools(self) -> List:
        """Setup all tools for the calculator tool"""
        @tool
        def estimate_total_hotel_cost(price_per_night: float, total_days: int) -> float:
            """Calculate total hotel cost by multiplying price per night by total days"""
            return self.calculator.multiply(price_per_night, total_days)
        
        @tool
        def calculate_total_expense(hotel_cost: float, food_cost: float, transport_cost: float, activities_cost: float = 0.0) -> float:
            """Calculate total expense of the trip by summing all costs"""
            return self.calculator.calculate_total(hotel_cost, food_cost, transport_cost, activities_cost)
        
        @tool
        def calculate_daily_expense_budget(total_cost: float, days: int) -> float:
            """Calculate daily expense budget by dividing total cost by number of days"""
            return self.calculator.calculate_daily_budget(total_cost, days)
        
        return [estimate_total_hotel_cost, calculate_total_expense, calculate_daily_expense_budget]