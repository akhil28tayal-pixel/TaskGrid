import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const timelineEvents: Array<{
  id: string;
  date: string;
  events: Array<{ id: string; title: string; type: string; client: string; status: string }>;
}> = [];

function getEventTypeColor(type: string) {
  const colors: Record<string, string> = {
    deadline: "bg-red-100 text-red-800 border-red-200",
    task: "bg-blue-100 text-blue-800 border-blue-200",
    meeting: "bg-purple-100 text-purple-800 border-purple-200",
    milestone: "bg-green-100 text-green-800 border-green-200",
  };
  return colors[type] || "bg-gray-100 text-gray-800 border-gray-200";
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatMonth(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function TimelinePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timeline</h1>
          <p className="text-gray-500">View project deadlines and milestones</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <CalendarIcon className="mr-2 h-4 w-4" />
            January 2024
          </Button>
          <Button variant="outline" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-8">
                  {timelineEvents.map((day) => (
                    <div key={day.id} className="relative pl-10">
                      <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-white" />
                      <div className="mb-2">
                        <span className="text-sm font-semibold text-gray-900">{formatDate(day.date)}</span>
                      </div>
                      <div className="space-y-2">
                        {day.events.map((event) => (
                          <div
                            key={event.id}
                            className={`rounded-lg border p-3 ${getEventTypeColor(event.type)}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{event.title}</p>
                                <p className="text-sm opacity-75">{event.client}</p>
                              </div>
                              <Badge variant="outline" className="capitalize">
                                {event.type}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm">Deadlines</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm">Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-purple-500" />
                <span className="text-sm">Meetings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm">Milestones</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">This Week</span>
                <span className="font-semibold">3 events</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">This Month</span>
                <span className="font-semibold">12 events</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Overdue</span>
                <span className="font-semibold text-red-600">2 items</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
