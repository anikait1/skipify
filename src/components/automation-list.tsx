import { Automation } from "../database";
import { player } from "../skipify";

export function AutomationList() {
  const automations: Automation[] = player.automations;
  if (!automations) {
    return <h1>No automations</h1>;
  }

  return (
    <section
      class="col-6"
      hx-get="/automations"
      hx-trigger="newAutomation from:body"
      hx-swap="outerHTML"
    >
      <table class="table table-stripped table-bordered">
        <thead>
          <tr>
            {["Spotify ID", "Name", "Action"].map((label) => (
              <th scope="col">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {automations.map((automation) => (
            <tr>
              <th scope="row">{automation.spotify_id}</th>
              <td>{automation.name}</td>
              <td>{JSON.stringify(automation.action, null, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
