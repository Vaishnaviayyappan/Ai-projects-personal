class Memory:
    def __init__(self):
        self.context = ""

    def add(self, observation):
        self.context += f"\nObservation: {observation}"

    def get(self):
        return self.context
