import React from 'react';
import { Lightbulb } from 'lucide-react';

interface SuggestedQueriesProps {
  onSelectQuery: (query: string) => void;
}

// Define suggested query categories and their queries
const suggestedQueries = [
  {
    category: 'Customer Information',
    queries: [
      'Show me a summary of all customers',
      'Which customers are in the Implementation phase?',
      'When is the next contract renewal?',
      'Which customer has the most processes?'
    ]
  },
  {
    category: 'Process Analysis',
    queries: [
      'How many processes are in the Development stage?',
      'Show me all processes pending approval',
      'Which functional area has the most processes?',
      'What\'s the distribution of processes by SDLC stage?'
    ]
  },
  {
    category: 'Team & Service Insights',
    queries: [
      'Which teams support the most customers?',
      'How many customers use the Data Ingestion service?',
      'Which team is assigned to the most processes?',
      'What are the most common services we provide?'
    ]
  }
];

const SuggestedQueries: React.FC<SuggestedQueriesProps> = ({ onSelectQuery }) => {
  return (
    <div className="mb-4">
      <div className="flex items-center mb-2">
        <Lightbulb size={16} className="mr-2 text-primary" />
        <h3 className="text-sm font-bold text-white">Suggested Queries</h3>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {suggestedQueries.map((category, categoryIndex) => (
          <div key={categoryIndex} className="space-y-1">
            <div className="text-xs text-primary font-semibold mb-1">
              {category.category}
            </div>
            <div className="flex flex-wrap gap-1">
              {category.queries.map((query, queryIndex) => (
                <button
                  key={queryIndex}
                  onClick={() => onSelectQuery(query)}
                  className="text-xs bg-card hover:bg-muted text-foreground px-2 py-1 rounded border border-border transition-colors"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQueries;
