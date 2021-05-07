import { ChangeAnalysisReport } from "../../change-analysis-report";
import { buildDiff } from "./example-model";

test('Report Graph returns proper graph', () => {
    const infraModelDiff = buildDiff();
    const report = new ChangeAnalysisReport(infraModelDiff, []);

    console.log(report.generateGraph);
});