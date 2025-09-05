import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink } from "lucide-react";

const Documents = () => {
  const documents = [
    {
      title: "Membership Agreement",
      description: "Terms and conditions of your Echelon Texas membership",
      type: "PDF",
      size: "245 KB",
      lastUpdated: "March 15, 2024",
      url: "#"
    },
    {
      title: "Privacy Policy",
      description: "How we protect and handle your personal information",
      type: "PDF", 
      size: "189 KB",
      lastUpdated: "March 10, 2024",
      url: "#"
    },
    {
      title: "Acceptable Use Policy",
      description: "Community guidelines and acceptable use standards",
      type: "PDF",
      size: "156 KB", 
      lastUpdated: "March 8, 2024",
      url: "#"
    },
    {
      title: "Refund Policy",
      description: "Membership cancellation and refund procedures",
      type: "PDF",
      size: "98 KB",
      lastUpdated: "March 5, 2024", 
      url: "#"
    },
    {
      title: "Code of Conduct", 
      description: "Expected behavior and community standards",
      type: "PDF",
      size: "167 KB",
      lastUpdated: "February 28, 2024",
      url: "#"
    },
    {
      title: "Data Protection Notice",
      description: "GDPR compliance and data protection information", 
      type: "PDF",
      size: "201 KB",
      lastUpdated: "February 25, 2024",
      url: "#"
    }
  ];

  const handleDownload = (docTitle: string) => {
    // TODO: Implement document download with Supabase Storage
  };

  const handleView = (docTitle: string) => {
    // TODO: Implement document viewing
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-gold mb-4">Member Documents</h1>
        <p className="text-white/70">
          Access important membership documents, policies, and agreements. All documents are available for download and reference.
        </p>
      </div>

      <div className="grid gap-6">
        {documents.map((doc, index) => (
          <Card key={index} className="bg-charcoal border-gold/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gold/20 rounded-lg">
                    <FileText className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg">{doc.title}</CardTitle>
                    <CardDescription className="text-white/60 mt-1">
                      {doc.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleView(doc.title)}
                    variant="outline"
                    size="sm"
                    className="border-gold/50 text-gold hover:bg-gold/20"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    onClick={() => handleDownload(doc.title)}
                    variant="outline" 
                    size="sm"
                    className="border-gold/50 text-gold hover:bg-gold/20"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-white/60">
                <div className="flex items-center space-x-4">
                  <span>{doc.type} • {doc.size}</span>
                </div>
                <span>Last updated: {doc.lastUpdated}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-charcoal border-gold/20 mt-8">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gold mb-2">Need Help?</h3>
            <p className="text-white/70 mb-4">
              If you have questions about any of these documents or need additional information, please contact our member support team.
            </p>
            <Button 
              variant="outline"
              className="border-gold/50 text-gold hover:bg-gold/20"
            >
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Documents;