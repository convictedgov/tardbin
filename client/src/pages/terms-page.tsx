import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-slate dark:prose-invert max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Paste, you accept and agree to be bound by the terms
            and provision of this agreement.
          </p>

          <h2>2. User Conduct</h2>
          <p>
            You agree not to use the service to:
          </p>
          <ul>
            <li>Upload any illegal or malicious content</li>
            <li>Violate any laws or regulations</li>
            <li>Infringe upon others' intellectual property rights</li>
            <li>Distribute spam or malware</li>
          </ul>

          <h2>3. Content</h2>
          <p>
            You retain all rights to your content. However, by posting content, you
            grant us a license to use, modify, and display that content as needed to
            provide the service.
          </p>

          <h2>4. Privacy</h2>
          <p>
            We collect and use your information as described in our Privacy Policy.
            By using Paste, you agree to our data practices.
          </p>

          <h2>5. Service Modifications</h2>
          <p>
            We reserve the right to modify or discontinue the service at any time,
            with or without notice to you.
          </p>

          <h2>6. Disclaimer of Warranties</h2>
          <p>
            The service is provided "as is" without any warranties of any kind,
            either express or implied.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
